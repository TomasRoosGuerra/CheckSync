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
  const { user, users } = useStore();

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
          date: customDate,
          startTime,
          endTime,
          participantIds,
          verifierId,
          notes,
        });
        // Real-time listener will update local state automatically
      } else {
        // Create new slot in Firestore
        const newSlot: Omit<TimeSlot, "id"> = {
          title,
          date: customDate,
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
        await createTimeSlot(newSlot);
        // Real-time listener will automatically add it to local state
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

  const [customDate, setCustomDate] = useState(
    slot?.date || formatDate(date)
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-lg w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {slot ? "Edit Practice" : "Add Practice"}
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
                Practice Name *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field text-base"
                placeholder="e.g., Tennis Practice"
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
              <p className="text-xs text-gray-500 mt-1">
                You can select past or future dates
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time *
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
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
                  onChange={(e) => setEndTime(e.target.value)}
                  className="input-field text-base"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tennis Coaches * (Select who's attending)
              </label>
              <div className="space-y-1.5 sm:space-y-2 max-h-48 overflow-y-auto">
                {users.map((u) => (
                  <label
                    key={u.id}
                    className="flex items-center gap-3 p-3 sm:p-3 rounded-lg border border-gray-200 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors touch-manipulation min-h-[52px]"
                  >
                    <input
                      type="checkbox"
                      checked={participantIds.includes(u.id)}
                      onChange={() => toggleParticipant(u.id)}
                      className="w-5 h-5 sm:w-4 sm:h-4 text-primary rounded focus:ring-primary"
                    />
                    <span className="flex-1 text-base sm:text-sm">{u.name}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{u.role}</span>
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
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field resize-none text-base"
                rows={3}
                placeholder="e.g., Bring tennis rackets, meet at court 3..."
              />
            </div>

            <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
              <button 
                type="submit" 
                className="btn-primary flex-1 text-base py-3 sm:py-2 touch-manipulation min-h-[48px] sm:min-h-auto"
              >
                {slot ? "Update" : "Create"} Practice
              </button>
              <button 
                type="button" 
                onClick={onClose} 
                className="btn-secondary text-base py-3 sm:py-2 px-6 sm:px-4 touch-manipulation min-h-[48px] sm:min-h-auto"
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
