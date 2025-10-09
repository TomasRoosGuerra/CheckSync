import { useEffect, useState } from "react";
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
}

export default function SlotModal({ date, slot, onClose }: SlotModalProps) {
  const { user, users, addTimeSlot, updateTimeSlot } = useStore();

  const [title, setTitle] = useState(slot?.title || "");
  const [startTime, setStartTime] = useState(slot?.startTime || "09:00");
  const [endTime, setEndTime] = useState(slot?.endTime || "10:00");
  const [participantIds, setParticipantIds] = useState<string[]>(
    slot?.participantIds || []
  );
  const [verifierId, setVerifierId] = useState(slot?.verifierId || "");
  const [notes, setNotes] = useState(slot?.notes || "");

  useEffect(() => {
    if (slot) {
      setTitle(slot.title);
      setStartTime(slot.startTime);
      setEndTime(slot.endTime);
      setParticipantIds(slot.participantIds);
      setVerifierId(slot.verifierId);
      setNotes(slot.notes || "");
    }
  }, [slot]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (slot) {
        // Update existing slot in Firestore
        await updateSlotFirestore(slot.id, {
          title,
          startTime,
          endTime,
          participantIds,
          verifierId,
          notes,
        });
        // Also update local state
        updateTimeSlot(slot.id, {
          title,
          startTime,
          endTime,
          participantIds,
          verifierId,
          notes,
        });
      } else {
        // Create new slot in Firestore
        const newSlot: Omit<TimeSlot, "id"> = {
          title,
          date: formatDate(date),
          startTime,
          endTime,
          participantIds,
          verifierId,
          status: "planned",
          notes,
          createdBy: user?.id || "",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        const slotId = await createTimeSlot(newSlot);
        // Add to local state with the new ID
        addTimeSlot({ ...newSlot, id: slotId });
      }
      onClose();
    } catch (error) {
      console.error("Error saving time slot:", error);
      alert("Failed to save time slot. Please try again.");
    }
  };

  const toggleParticipant = (userId: string) => {
    if (participantIds.includes(userId)) {
      setParticipantIds(participantIds.filter((id) => id !== userId));
    } else {
      setParticipantIds([...participantIds, userId]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {slot ? "Edit Time Slot" : "Add Time Slot"}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="e.g., Gym training"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time *
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="input-field"
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
                  onChange={(e) => setEndTime(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Participants *
              </label>
              <div className="space-y-2">
                {users.map((u) => (
                  <label
                    key={u.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={participantIds.includes(u.id)}
                      onChange={() => toggleParticipant(u.id)}
                      className="w-4 h-4 text-primary rounded focus:ring-primary"
                    />
                    <span className="flex-1">{u.name}</span>
                    <span className="text-xs text-gray-500">{u.role}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Verifier *
              </label>
              <select
                value={verifierId}
                onChange={(e) => setVerifierId(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select verifier</option>
                {users
                  .filter((u) => u.role === "verifier" || u.role === "both")
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
              </select>
              {users.filter((u) => u.role === "verifier" || u.role === "both")
                .length === 0 && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>No verifiers available.</strong>
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Go to Settings and change your role to "Verifier" or "Both", or
                    add connections who can verify.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field resize-none"
                rows={3}
                placeholder="Additional details..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button type="submit" className="btn-primary flex-1">
                {slot ? "Update" : "Create"} Slot
              </button>
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
