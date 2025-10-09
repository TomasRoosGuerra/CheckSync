import { useState } from "react";
import {
  deleteTimeSlot as deleteSlotFirestore,
  updateTimeSlot as updateSlotFirestore,
} from "../services/firestoreService";
import { useStore } from "../store";
import type { TimeSlot } from "../types";
import { formatDate, getDayName, isSameDayAs } from "../utils/dateUtils";
import SlotModal from "./SlotModal";

interface DayViewProps {
  date: Date;
  onClose: () => void;
}

export default function DayView({ date, onClose }: DayViewProps) {
  const { timeSlots, user, updateTimeSlot, deleteTimeSlot, users } = useStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);

  const daySlots = timeSlots
    .filter((slot) => isSameDayAs(date, slot.date))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const handleCheckIn = async (slot: TimeSlot) => {
    if (slot.participantIds.includes(user?.id || "")) {
      try {
        const updates = {
          status: "checked-in" as const,
          checkedInAt: Date.now(),
        };
        await updateSlotFirestore(slot.id, updates);
        updateTimeSlot(slot.id, updates);
      } catch (error) {
        console.error("Error checking in:", error);
        alert("Failed to check in. Please try again.");
      }
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
          updateTimeSlot(slot.id, updates);
        } catch (error) {
          console.error("Error undoing check-in:", error);
          alert("Failed to undo check-in. Please try again.");
        }
      }
    }
  };

  const handleConfirm = async (slot: TimeSlot) => {
    if (slot.verifierId === user?.id) {
      try {
        const updates = {
          status: "confirmed" as const,
          confirmedAt: Date.now(),
        };
        await updateSlotFirestore(slot.id, updates);
        updateTimeSlot(slot.id, updates);
      } catch (error) {
        console.error("Error confirming:", error);
        alert("Failed to confirm attendance. Please try again.");
      }
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
          updateTimeSlot(slot.id, updates);
        } catch (error) {
          console.error("Error undoing confirmation:", error);
          alert("Failed to undo confirmation. Please try again.");
        }
      }
    }
  };

  const handleDelete = async (slotId: string) => {
    if (confirm("Delete this time slot?")) {
      try {
        await deleteSlotFirestore(slotId);
        deleteTimeSlot(slotId);
      } catch (error) {
        console.error("Error deleting:", error);
        alert("Failed to delete time slot. Please try again.");
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-dark text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{getDayName(date)}</h2>
              <p className="text-primary-light mt-1">
                {formatDate(date, "MMMM d, yyyy")}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Slots List */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {daySlots.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-2">📅</div>
              <p>No time slots for this day</p>
            </div>
          ) : (
            <div className="space-y-3">
              {daySlots.map((slot) => (
                <div
                  key={slot.id}
                  className="card hover:shadow-md transition-shadow relative border-l-4 border-l-primary/30"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                          {slot.startTime}
                        </span>
                        <h3 className="font-semibold text-lg text-gray-900">
                          {slot.title}
                        </h3>
                      </div>
                      <div className="text-sm text-gray-500 ml-[4.5rem]">
                        Ends at {slot.endTime}
                      </div>
                    </div>
                    {getStatusBadge(slot.status)}
                  </div>

                  {slot.notes && (
                    <p className="text-sm text-gray-600 mb-3">{slot.notes}</p>
                  )}

                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">👤 Participants:</span>
                      <span className="font-medium">
                        {slot.participantIds.map(getUserName).join(", ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">🔒 Verifier:</span>
                      <span className="font-medium">
                        {getUserName(slot.verifierId)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    {/* Check In Button (Planned status) */}
                    {slot.participantIds.includes(user?.id || "") &&
                      slot.status === "planned" && (
                        <button
                          onClick={() => handleCheckIn(slot)}
                          className="btn-accent text-sm py-1.5"
                        >
                          ✅ Check In
                        </button>
                      )}

                    {/* Undo Check-In Button (Checked-in status) */}
                    {slot.participantIds.includes(user?.id || "") &&
                      slot.status === "checked-in" && (
                        <button
                          onClick={() => handleUndoCheckIn(slot)}
                          className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 font-medium py-1.5 px-4 rounded-full transition-colors text-sm"
                        >
                          ↩️ Undo Check-In
                        </button>
                      )}

                    {/* Confirm Attendance Button (Checked-in status) */}
                    {slot.verifierId === user?.id &&
                      slot.status === "checked-in" && (
                        <button
                          onClick={() => handleConfirm(slot)}
                          className="btn-primary text-sm py-1.5"
                        >
                          🔒 Confirm Attendance
                        </button>
                      )}

                    {/* Undo Confirmation Button (Confirmed status) */}
                    {slot.verifierId === user?.id &&
                      slot.status === "confirmed" && (
                        <button
                          onClick={() => handleUndoConfirmation(slot)}
                          className="bg-green-50 hover:bg-green-100 text-green-700 font-medium py-1.5 px-4 rounded-full transition-colors text-sm"
                        >
                          ↩️ Undo Confirmation
                        </button>
                      )}

                    {/* Edit Button (Always available) */}
                    <button
                      onClick={() => setEditingSlot(slot)}
                      className="btn-secondary text-sm py-1.5"
                    >
                      ✏️ Edit
                    </button>

                    {/* Delete Button (Always available) */}
                    <button
                      onClick={() => handleDelete(slot.id)}
                      className="bg-red-50 hover:bg-red-100 text-red-700 font-medium py-1.5 px-4 rounded-full transition-colors text-sm"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary flex-1"
          >
            ➕ Add Time Slot
          </button>
          <button onClick={onClose} className="btn-secondary">
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
