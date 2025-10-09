import { useState } from "react";
import {
  deleteTimeSlot as deleteSlotFirestore,
  updateTimeSlot as updateSlotFirestore,
} from "../services/firestoreService";
import { useStore } from "../store";
import type { TimeSlot } from "../types";
import { formatDate, getDayName, isSameDayAs } from "../utils/dateUtils";
import {
  canCheckIn,
  canVerify,
  canEditSlot,
  canDeleteSlot,
  canCreateSlot,
} from "../utils/permissions";
import SlotModal from "./SlotModal";

interface DayViewProps {
  date: Date;
  onClose: () => void;
}

export default function DayView({ date, onClose }: DayViewProps) {
  const { timeSlots, user, users } = useStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);

  const daySlots = timeSlots
    .filter((slot) => isSameDayAs(date, slot.date))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const handleCheckIn = async (slot: TimeSlot) => {
    if (!canCheckIn(user, slot)) {
      alert("You don't have permission to check in to this slot.");
      return;
    }
    
    try {
      const updates = {
        status: "checked-in" as const,
        checkedInAt: Date.now(),
      };
      await updateSlotFirestore(slot.id, updates);
    } catch (error) {
      console.error("Error checking in:", error);
      alert("Failed to check in. Please try again.");
    }
  };

  const handleUndoCheckIn = async (slot: TimeSlot) => {
    if (slot.participantIds.includes(user?.id || "")) {
      if (confirm("Undo check-in and return to planned status?")) {
        try {
          const updates = {
            status: "planned" as const,
            checkedInAt: undefined,
          };
          await updateSlotFirestore(slot.id, updates);
          // Real-time listener will update local state automatically
        } catch (error) {
          console.error("Error undoing check-in:", error);
          alert("Failed to undo check-in. Please try again.");
        }
      }
    }
  };

  const handleConfirm = async (slot: TimeSlot) => {
    if (!canVerify(user, slot)) {
      alert("You don't have permission to verify this slot.");
      return;
    }
    
    try {
      const updates = {
        status: "confirmed" as const,
        confirmedAt: Date.now(),
      };
      await updateSlotFirestore(slot.id, updates);
    } catch (error) {
      console.error("Error confirming:", error);
      alert("Failed to confirm attendance. Please try again.");
    }
  };

  const handleUndoConfirmation = async (slot: TimeSlot) => {
    if (slot.verifierId === user?.id) {
      if (confirm("Undo confirmation and return to checked-in status?")) {
        try {
          const updates = {
            status: "checked-in" as const,
            confirmedAt: undefined,
          };
          await updateSlotFirestore(slot.id, updates);
          // Real-time listener will update local state automatically
        } catch (error) {
          console.error("Error undoing confirmation:", error);
          alert("Failed to undo confirmation. Please try again.");
        }
      }
    }
  };

  const handleDelete = async (slot: TimeSlot) => {
    // Check if this is a recurring slot
    if (slot.recurringGroupId && slot.isRecurring) {
      // Find all slots in the same recurring group
      const recurringSlotsCount = timeSlots.filter(
        s => s.recurringGroupId === slot.recurringGroupId
      ).length;

      if (recurringSlotsCount > 1) {
        // Ask user: delete this one or all?
        const choice = window.confirm(
          `This is part of a recurring series (${recurringSlotsCount} slots).\n\n` +
          `Click OK to delete ALL ${recurringSlotsCount} slots in this series.\n` +
          `Click Cancel to delete ONLY this occurrence.`
        );

        if (choice === null) return; // User cancelled

        try {
          if (choice) {
            // Delete all in series
            console.log(`🗑️ Deleting all ${recurringSlotsCount} recurring slots...`);
            const slotsToDelete = timeSlots.filter(
              s => s.recurringGroupId === slot.recurringGroupId
            );
            
            for (const s of slotsToDelete) {
              await deleteSlotFirestore(s.id);
            }
            console.log(`✅ Deleted ${slotsToDelete.length} recurring slots`);
          } else {
            // Delete just this one
            console.log("🗑️ Deleting single occurrence...");
            await deleteSlotFirestore(slot.id);
            console.log("✅ Deleted single slot");
          }
        } catch (error) {
          console.error("Error deleting:", error);
          alert("Failed to delete time slot(s). Please try again.");
        }
      } else {
        // Only one slot in series, just delete it
        if (confirm("Delete this time slot?")) {
          try {
            await deleteSlotFirestore(slot.id);
          } catch (error) {
            console.error("Error deleting:", error);
            alert("Failed to delete time slot. Please try again.");
          }
        }
      }
    } else {
      // Not a recurring slot, normal delete
      if (confirm("Delete this time slot?")) {
        try {
          await deleteSlotFirestore(slot.id);
        } catch (error) {
          console.error("Error deleting:", error);
          alert("Failed to delete time slot. Please try again.");
        }
      }
    }
  };

  const getStatusBadge = (status: TimeSlot["status"]) => {
    const styles = {
      planned: "bg-gray-100 text-gray-700",
      "checked-in": "bg-yellow-100 text-yellow-700",
      confirmed: "bg-green-100 text-green-700",
      missed: "bg-red-100 text-red-700",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
      </span>
    );
  };

  const getUserName = (userId: string) => {
    return users.find((u) => u.id === userId)?.name || "Unknown";
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] sm:max-h-[90vh] overflow-hidden">
        {/* Header - Mobile Optimized */}
        <div className="bg-gradient-to-r from-primary to-primary-dark text-white p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">{getDayName(date)}</h2>
              <p className="text-primary-light mt-1 text-sm sm:text-base">
                {formatDate(date, "MMMM d, yyyy")}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 flex items-center justify-center transition-colors touch-manipulation"
            >
              <span className="text-xl sm:text-base">✕</span>
            </button>
          </div>
        </div>

        {/* Slots List - Mobile Optimized */}
        <div className="p-3 sm:p-6 overflow-y-auto max-h-[calc(92vh-180px)] sm:max-h-[calc(90vh-180px)]">
          {daySlots.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-gray-500">
              <div className="text-3xl sm:text-4xl mb-2">📅</div>
              <p className="text-sm sm:text-base">No time slots scheduled</p>
              <p className="text-xs text-gray-400 mt-1">Tap "Add Time Slot" below</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {daySlots.map((slot) => (
                <div
                  key={slot.id}
                  className="card hover:shadow-md transition-shadow relative border-l-4 border-l-primary/30 p-3 sm:p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-primary bg-primary/10 px-2 sm:px-3 py-1 rounded">
                          {slot.startTime}
                        </span>
                        <h3 className="font-semibold text-base sm:text-lg text-gray-900">
                          {slot.title}
                        </h3>
                        {slot.isRecurring && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            🔁 Recurring
                          </span>
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 ml-0 sm:ml-[4.5rem]">
                        Ends at {slot.endTime}
                      </div>
                    </div>
                    {getStatusBadge(slot.status)}
                  </div>

                  {slot.notes && (
                    <p className="text-sm text-gray-600 mb-3">{slot.notes}</p>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-4 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">👤</span>
                      <span className="font-medium">
                        {slot.participantIds.map(getUserName).join(", ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">🔒</span>
                      <span className="font-medium">
                        {getUserName(slot.verifierId)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    {/* Check In Button - Mobile Optimized */}
                    {canCheckIn(user, slot) && slot.status === "planned" && (
                      <button
                        onClick={() => handleCheckIn(slot)}
                        className="btn-accent text-xs sm:text-sm py-2.5 sm:py-1.5 px-4 sm:px-6 touch-manipulation min-h-[44px] sm:min-h-auto"
                      >
                        ✅ Check In
                      </button>
                    )}

                    {/* Undo Check-In Button - Mobile Optimized */}
                    {canCheckIn(user, slot) && slot.status === "checked-in" && (
                      <button
                        onClick={() => handleUndoCheckIn(slot)}
                        className="bg-yellow-50 hover:bg-yellow-100 active:bg-yellow-200 text-yellow-700 font-medium py-2.5 sm:py-1.5 px-4 rounded-full transition-colors text-xs sm:text-sm touch-manipulation min-h-[44px] sm:min-h-auto"
                      >
                        ↩️ Undo Check-In
                      </button>
                    )}

                    {/* Confirm Attendance - Mobile Optimized */}
                    {canVerify(user, slot) && slot.status === "checked-in" && (
                      <button
                        onClick={() => handleConfirm(slot)}
                        className="btn-primary text-xs sm:text-sm py-2.5 sm:py-1.5 px-4 sm:px-6 touch-manipulation min-h-[44px] sm:min-h-auto"
                      >
                        🔒 Confirm
                      </button>
                    )}

                    {/* Undo Confirmation - Mobile Optimized */}
                    {canVerify(user, slot) && slot.status === "confirmed" && (
                      <button
                        onClick={() => handleUndoConfirmation(slot)}
                        className="bg-green-50 hover:bg-green-100 active:bg-green-200 text-green-700 font-medium py-2.5 sm:py-1.5 px-4 rounded-full transition-colors text-xs sm:text-sm touch-manipulation min-h-[44px] sm:min-h-auto"
                      >
                        ↩️ Undo
                      </button>
                    )}

                    {/* Edit Button - Mobile Optimized */}
                    {canEditSlot(user, slot) && (
                      <button
                        onClick={() => setEditingSlot(slot)}
                        className="btn-secondary text-xs sm:text-sm py-2.5 sm:py-1.5 px-4 touch-manipulation min-h-[44px] sm:min-h-auto"
                      >
                        ✏️ Edit
                      </button>
                    )}

                    {/* Delete Button - Mobile Optimized */}
                    {canDeleteSlot(user, slot) && (
                      <button
                        onClick={() => handleDelete(slot)}
                        className="bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-700 font-medium py-2.5 sm:py-1.5 px-4 rounded-full transition-colors text-xs sm:text-sm touch-manipulation min-h-[44px] sm:min-h-auto"
                      >
                        🗑️ {slot.isRecurring ? 'Delete Series' : 'Delete'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Mobile Optimized */}
        <div className="border-t border-gray-200 p-3 sm:p-4 flex gap-2 bg-white sticky bottom-0">
          {canCreateSlot(user) ? (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn-primary flex-1 text-sm sm:text-base py-3 sm:py-2 touch-manipulation min-h-[48px] sm:min-h-auto"
            >
              ➕ Add Time Slot
            </button>
          ) : (
            <div className="flex-1 text-xs text-gray-500 text-center py-2">
              Only Managers and Admins can create slots
            </div>
          )}
          <button 
            onClick={onClose} 
            className="btn-secondary text-sm sm:text-base py-3 sm:py-2 px-6 sm:px-4 touch-manipulation min-h-[48px] sm:min-h-auto"
          >
            Close
          </button>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(isAddModalOpen || editingSlot) && (
        <SlotModal
          date={date}
          slot={editingSlot || undefined}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingSlot(null);
          }}
        />
      )}
    </div>
  );
}
