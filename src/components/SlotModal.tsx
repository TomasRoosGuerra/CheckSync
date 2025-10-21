import { useEffect, useState } from "react";
import { useToggleSelection } from "../hooks/useToggleSelection";
import {
  createTimeSlot,
  updateTimeSlot as updateSlotFirestore,
} from "../services/firestoreService";
import { useStore } from "../store";
import type { TimeSlot } from "../types";
import { formatDate } from "../utils/dateUtils";

interface SlotModalProps {
  date: Date;
  slot?: TimeSlot;
  onClose: () => void;
  bulkEditMode?: {
    type: "edit" | "delete" | "status" | "participants";
    recurringGroupId: string;
  };
}

export default function SlotModal({
  date,
  slot,
  onClose,
  bulkEditMode,
}: SlotModalProps) {
  const { user, users, currentWorkspace, labels } = useStore();

  const [title, setTitle] = useState(slot?.title || "");
  const [startTime, setStartTime] = useState(slot?.startTime || "09:00");
  const [endTime, setEndTime] = useState(slot?.endTime || "10:00");

  // Auto-adjust time validation
  const handleStartTimeChange = (newStartTime: string) => {
    setStartTime(newStartTime);

    // If start time is after end time, adjust end time to be 1 hour later
    if (newStartTime >= endTime) {
      const [hours, minutes] = newStartTime.split(":").map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + 60; // Add 1 hour

      // Handle day overflow
      const endHours = Math.floor(endMinutes / 60) % 24;
      const endMins = endMinutes % 60;

      setEndTime(
        `${endHours.toString().padStart(2, "0")}:${endMins
          .toString()
          .padStart(2, "0")}`
      );
    }
  };

  const handleEndTimeChange = (newEndTime: string) => {
    setEndTime(newEndTime);

    // If end time is before or equal to start time, adjust start time to be 1 hour earlier
    if (newEndTime <= startTime) {
      const [hours, minutes] = newEndTime.split(":").map(Number);
      const endMinutes = hours * 60 + minutes;
      const startMinutes = endMinutes - 60; // Subtract 1 hour

      // Handle day underflow
      const startHours = startMinutes < 0 ? 23 : Math.floor(startMinutes / 60);
      const startMins =
        startMinutes < 0 ? 60 + (startMinutes % 60) : startMinutes % 60;

      setStartTime(
        `${startHours.toString().padStart(2, "0")}:${startMins
          .toString()
          .padStart(2, "0")}`
      );
    }
  };
  const {
    selected: participantIds,
    toggle: toggleParticipant,
    isSelected,
    setSelected: setParticipantIds,
  } = useToggleSelection(slot?.participantIds || []);
  const [verifierId, setVerifierId] = useState(slot?.verifierId || "");
  const [notes, setNotes] = useState(slot?.notes || "");
  const [labelId, setLabelId] = useState(slot?.labelId || "");
  const [labelProperties, setLabelProperties] = useState<
    Record<string, string | number>
  >(slot?.labelProperties || {});
  const [recurring, setRecurring] = useState(false);
  const [weeksAhead, setWeeksAhead] = useState(1);

  useEffect(() => {
    if (slot) {
      setTitle(slot.title);
      setStartTime(slot.startTime);
      setEndTime(slot.endTime);
      setParticipantIds(slot.participantIds);
      setVerifierId(slot.verifierId);
      setNotes(slot.notes || "");
      setLabelId(slot.labelId || "");
      setLabelProperties(slot.labelProperties || {});
    }
  }, [slot]);

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (saving) return;

    setSaving(true);

    try {
      console.log("💾 Starting save operation...");
      console.log("User ID:", user?.id);
      console.log("Participants:", participantIds);
      console.log("Verifier:", verifierId);

      // Handle bulk edit mode
      if (bulkEditMode && slot) {
        console.log("📝 Bulk editing recurring slots...");
        const { timeSlots } = useStore.getState();
        const recurringSlots = timeSlots.filter(
          (s) => s.recurringGroupId === bulkEditMode.recurringGroupId
        );

        const updateData: any = {
          title,
          startTime,
          endTime,
          participantIds,
          verifierId,
          notes,
        };

        if (labelId) {
          updateData.labelId = labelId;
          if (Object.keys(labelProperties).length > 0) {
            updateData.labelProperties = labelProperties;
          }
        }

        for (const recurringSlot of recurringSlots) {
          await updateSlotFirestore(recurringSlot.id, updateData);
        }

        console.log(`✅ Updated ${recurringSlots.length} recurring slots`);
        setSaving(false);
        onClose();
        return;
      }

      if (slot) {
        console.log("📝 Updating existing slot:", slot.id);
        const updateData: any = {
          title,
          date: customDate,
          startTime,
          endTime,
          participantIds,
          verifierId,
          notes,
        };

        if (labelId) {
          updateData.labelId = labelId;
          if (Object.keys(labelProperties).length > 0) {
            updateData.labelProperties = labelProperties;
          }
        }

        const updatePromise = updateSlotFirestore(slot.id, updateData);

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => {
            console.error("⏱️ Update timed out after 15 seconds");
            reject(new Error("Operation timed out"));
          }, 15000)
        );

        await Promise.race([updatePromise, timeoutPromise]);
        console.log("✅ Slot updated successfully");
      } else {
        console.log("➕ Creating new slot(s)...");

        // Ensure workspace exists
        if (!currentWorkspace) {
          alert(
            "No workspace selected. Please select or create a workspace first."
          );
          setSaving(false);
          return;
        }

        // Generate recurring group ID if creating multiple slots
        const recurringGroupId =
          recurring && weeksAhead > 1 ? `recurring-${Date.now()}` : null;

        const baseSlot: Omit<
          TimeSlot,
          "id" | "date" | "createdAt" | "updatedAt"
        > = {
          workspaceId: currentWorkspace.id,
          title,
          startTime,
          endTime,
          participantIds,
          verifierId,
          status: "planned",
          notes,
          createdBy: user?.id || "",
          isRecurring: recurring && weeksAhead > 1,
          ...(recurringGroupId && { recurringGroupId }),
          ...(labelId && {
            labelId,
            ...(Object.keys(labelProperties).length > 0 && { labelProperties }),
          }),
        };

        // Create recurring slots if requested
        const datesToCreate: string[] = [customDate];

        if (recurring && weeksAhead > 1) {
          console.log(`📅 Creating recurring slots for ${weeksAhead} weeks`);
          const baseDate = new Date(customDate);
          for (let i = 1; i < weeksAhead; i++) {
            const futureDate = new Date(baseDate);
            futureDate.setDate(baseDate.getDate() + i * 7);
            datesToCreate.push(futureDate.toISOString().split("T")[0]);
          }
        }

        console.log(`Creating ${datesToCreate.length} slot(s)...`);

        // Create all slots with reduced timeout per slot
        for (const dateStr of datesToCreate) {
          const newSlot: Omit<TimeSlot, "id"> = {
            ...baseSlot,
            date: dateStr,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          const createPromise = createTimeSlot(newSlot);
          const timeoutPromise = new Promise(
            (_, reject) =>
              setTimeout(() => {
                console.error("⏱️ Create timed out for date:", dateStr);
                reject(new Error("Operation timed out"));
              }, 8000) // Shorter timeout per slot
          );

          await Promise.race([createPromise, timeoutPromise]);
        }

        console.log(`✅ ${datesToCreate.length} slot(s) created successfully`);
      }

      console.log("🚪 Closing modal...");
      setSaving(false);
      onClose();
      console.log("✅ Modal closed");
    } catch (error: any) {
      console.error("❌ Error saving time slot:", error);

      if (error.message === "Operation timed out") {
        alert(
          "Save timed out. The slot may have been created. Check your internet and refresh the page."
        );
      } else if (error.code === "permission-denied") {
        alert(
          "Permission denied. Check Firestore security rules in Firebase Console."
        );
      } else {
        alert(`Failed to save: ${error.message || "Unknown error"}`);
      }

      setSaving(false);
    }
  };

  const [customDate, setCustomDate] = useState(slot?.date || formatDate(date));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-lg w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {bulkEditMode
                ? `Edit All Recurring Slots`
                : slot
                ? "Edit Time Slot"
                : "Add Time Slot"}
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center transition-colors touch-manipulation"
            >
              <span className="text-lg sm:text-base">✕</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field text-base"
                placeholder="e.g., Team Meeting"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="input-field text-base"
                required
              />

              {/* Recurring Option */}
              {!slot && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={recurring}
                      onChange={(e) => setRecurring(e.target.checked)}
                      className="w-4 h-4 text-primary rounded"
                    />
                    <span className="text-sm font-medium text-gray-900">
                      Repeat weekly
                    </span>
                  </label>

                  {recurring && (
                    <div className="mt-2 flex items-center gap-2">
                      <label className="text-xs text-gray-700">
                        For how many weeks?
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="52"
                        value={weeksAhead}
                        onChange={(e) =>
                          setWeeksAhead(
                            Math.max(1, parseInt(e.target.value) || 1)
                          )
                        }
                        className="input-field text-sm w-20 py-1 px-2"
                      />
                      <span className="text-xs text-gray-500">
                        ({weeksAhead} {weeksAhead === 1 ? "week" : "weeks"})
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time *
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className="input-field text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time *
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                  className="input-field text-base"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Participants * (Select who's attending)
              </label>
              <div className="space-y-1.5 sm:space-y-2 max-h-48 overflow-y-auto">
                {users.map((u) => (
                  <label
                    key={u.id}
                    className="flex items-center gap-3 p-3 sm:p-3 rounded-lg border border-gray-200 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors touch-manipulation min-h-[52px]"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected(u.id)}
                      onChange={() => toggleParticipant(u.id)}
                      className="w-5 h-5 sm:w-4 sm:h-4 text-primary rounded focus:ring-primary"
                    />
                    <span className="flex-1 text-base sm:text-sm">
                      {u.name}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {u.role}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Verifier * (Who confirms attendance)
              </label>
              <select
                value={verifierId}
                onChange={(e) => setVerifierId(e.target.value)}
                className="input-field text-base"
                required
              >
                <option value="">Select verifier</option>
                {users
                  .filter((u) =>
                    ["verifier", "manager", "admin"].includes(u.role)
                  )
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.role === "admin" && "👑 "}
                      {u.role === "manager" && "📊 "}
                      {u.role === "verifier" && "🔒 "}
                      {u.name}
                    </option>
                  ))}
              </select>
              {users.filter((u) =>
                ["verifier", "manager", "admin"].includes(u.role)
              ).length === 0 && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>No verifiers available.</strong>
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Set your role to Verifier/Manager/Admin in Settings, or add
                    connections who can verify.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Label (optional)
              </label>
              <select
                value={labelId}
                onChange={(e) => setLabelId(e.target.value)}
                className="input-field text-base"
              >
                <option value="">No label</option>
                {labels
                  .filter((label) => label.workspaceId === currentWorkspace?.id)
                  .map((label) => (
                    <option key={label.id} value={label.id}>
                      🏷️ {label.name}
                    </option>
                  ))}
              </select>
              {labels.filter(
                (label) => label.workspaceId === currentWorkspace?.id
              ).length === 0 && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>No labels available.</strong>
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Create labels in Settings to organize your time slots.
                  </p>
                </div>
              )}
            </div>

            {/* Label Properties */}
            {labelId && labels.find((l) => l.id === labelId)?.properties && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Label Details
                </label>
                <div className="space-y-2">
                  {labels
                    .find((l) => l.id === labelId)
                    ?.properties?.map((property) => (
                      <div key={property.id}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {property.name}{" "}
                          {property.required && (
                            <span className="text-red-500">*</span>
                          )}
                        </label>
                        {property.type === "text" && (
                          <input
                            type="text"
                            value={
                              (labelProperties[property.id] as string) || ""
                            }
                            onChange={(e) =>
                              setLabelProperties({
                                ...labelProperties,
                                [property.id]: e.target.value,
                              })
                            }
                            placeholder={
                              property.options?.placeholder ||
                              `Enter ${property.name.toLowerCase()}`
                            }
                            className="input-field text-sm"
                            required={property.required}
                          />
                        )}
                        {property.type === "number" && (
                          <input
                            type="number"
                            value={
                              (labelProperties[property.id] as number) || ""
                            }
                            onChange={(e) =>
                              setLabelProperties({
                                ...labelProperties,
                                [property.id]: parseFloat(e.target.value) || 0,
                              })
                            }
                            min={property.options?.min}
                            max={property.options?.max}
                            step={property.options?.step}
                            className="input-field text-sm"
                            required={property.required}
                          />
                        )}
                        {property.type === "range" && (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={
                                (labelProperties[property.id] as number) || ""
                              }
                              onChange={(e) =>
                                setLabelProperties({
                                  ...labelProperties,
                                  [property.id]:
                                    parseFloat(e.target.value) || 0,
                                })
                              }
                              min={property.options?.min}
                              max={property.options?.max}
                              className="input-field text-sm flex-1"
                              required={property.required}
                            />
                            {property.options?.min !== undefined &&
                              property.options?.max !== undefined && (
                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                  ({property.options.min}-{property.options.max}
                                  )
                                </span>
                              )}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field resize-none text-base"
                rows={3}
                placeholder="Additional details or instructions..."
              />
            </div>

            <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex-1 text-base py-3 sm:py-2 touch-manipulation min-h-[48px] sm:min-h-auto disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg"
              >
                {saving
                  ? "Saving..."
                  : bulkEditMode
                  ? "✓ Update All Slots"
                  : slot
                  ? "✓ Update Slot"
                  : recurring && weeksAhead > 1
                  ? `✓ Create ${weeksAhead} Slots`
                  : "✓ Create Slot"}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="btn-secondary text-base py-3 sm:py-2 px-6 sm:px-4 touch-manipulation min-h-[48px] sm:min-h-auto disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
