import { useState } from "react";
import type { TimeSlot } from "../types";

interface MobileStatusModalProps {
  slot: TimeSlot | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (
    status: "sick" | "away",
    reason: string,
    duration: string
  ) => void;
}

export default function MobileStatusModal({
  slot,
  isOpen,
  onClose,
  onStatusChange,
}: MobileStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<"sick" | "away" | null>(
    null
  );
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("today");

  if (!isOpen || !slot) return null;

  const handleSubmit = () => {
    if (selectedStatus && reason.trim()) {
      onStatusChange(selectedStatus, reason.trim(), duration);
      onClose();
      // Reset form
      setSelectedStatus(null);
      setReason("");
      setDuration("today");
    }
  };

  const handleBack = () => {
    setSelectedStatus(null);
    setReason("");
    setDuration("today");
  };

  const handleClose = () => {
    onClose();
    // Reset form
    setSelectedStatus(null);
    setReason("");
    setDuration("today");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-400 to-orange-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {!selectedStatus
                  ? "Mark Status"
                  : selectedStatus === "sick"
                  ? "Mark as Sick"
                  : "Mark as Away"}
              </h2>
              <p className="text-orange-100 mt-1 text-sm">
                {slot.title} - {slot.startTime}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 flex items-center justify-center transition-colors touch-manipulation"
              aria-label="Close status modal"
            >
              <span className="text-xl">✕</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {!selectedStatus ? (
            // Status selection
            <div className="space-y-4">
              <p className="text-gray-600 text-center mb-6">
                How would you like to mark this slot?
              </p>

              <button
                onClick={() => setSelectedStatus("sick")}
                className="w-full p-6 rounded-2xl border-2 border-orange-200 bg-orange-50 hover:bg-orange-100 active:bg-orange-200 transition-colors touch-manipulation"
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">🏥</span>
                  <div className="text-left">
                    <div className="font-bold text-lg text-gray-900">
                      Mark as Sick
                    </div>
                    <div className="text-sm text-gray-600">
                      Feeling unwell or have medical issues
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedStatus("away")}
                className="w-full p-6 rounded-2xl border-2 border-orange-200 bg-orange-50 hover:bg-orange-100 active:bg-orange-200 transition-colors touch-manipulation"
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">🚫</span>
                  <div className="text-left">
                    <div className="font-bold text-lg text-gray-900">
                      Mark as Away
                    </div>
                    <div className="text-sm text-gray-600">
                      Personal reasons or unavailable
                    </div>
                  </div>
                </div>
              </button>
            </div>
          ) : (
            // Details form
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBack}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center transition-colors touch-manipulation"
                >
                  <span className="text-lg">←</span>
                </button>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">
                    {selectedStatus === "sick"
                      ? "🏥 Mark as Sick"
                      : "🚫 Mark as Away"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedStatus === "sick"
                      ? "Let your team know you're unwell"
                      : "Let your team know you're unavailable"}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Reason (Required)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    selectedStatus === "sick"
                      ? "e.g., Flu symptoms, headache, doctor appointment..."
                      : "e.g., Personal appointment, family emergency, vacation..."
                  }
                  className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none text-lg"
                  rows={3}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg"
                >
                  <option value="today">Today only</option>
                  <option value="this-week">This week</option>
                  <option value="next-week">Next week</option>
                  <option value="until-further-notice">
                    Until further notice
                  </option>
                </select>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={!reason.trim()}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg_gray-300 disabled:cursor-not-allowed text-gray-900 py-4 px-6 rounded-xl font-bold text-lg transition-colors touch-manipulation"
                >
                  Mark as {selectedStatus === "sick" ? "Sick" : "Away"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
