import { useState } from "react";
import type { TimeSlot } from "../types";

interface StatusContextMenuProps {
  slot: TimeSlot;
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onStatusChange: (status: "sick" | "away", reason: string, duration: string) => void;
}

export default function StatusContextMenu({
  slot,
  isOpen,
  position,
  onClose,
  onStatusChange,
}: StatusContextMenuProps) {
  const [selectedStatus, setSelectedStatus] = useState<"sick" | "away" | null>(null);
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("today");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (selectedStatus && reason.trim()) {
      onStatusChange(selectedStatus, reason.trim(), duration);
      onClose();
    }
  };

  const handleBack = () => {
    setSelectedStatus(null);
    setReason("");
    setDuration("today");
  };

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        className="absolute bg-white rounded-lg shadow-2xl border border-gray-200 p-4 min-w-[280px] max-w-[320px]"
        style={{
          left: Math.min(position.x, window.innerWidth - 320),
          top: Math.min(position.y, window.innerHeight - 200),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {!selectedStatus ? (
          // Status selection
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 mb-3">Mark Status</h3>
            
            <button
              onClick={() => setSelectedStatus("sick")}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-orange-50 hover:border-orange-300 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏥</span>
                <div>
                  <div className="font-medium text-gray-900">Mark as Sick</div>
                  <div className="text-sm text-gray-600">I'm feeling unwell</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setSelectedStatus("away")}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-orange-50 hover:border-orange-300 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚫</span>
                <div>
                  <div className="font-medium text-gray-900">Mark as Away</div>
                  <div className="text-sm text-gray-600">Personal reasons, unavailable</div>
                </div>
              </div>
            </button>

            <button
              onClick={onClose}
              className="w-full text-center py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          // Details form
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handleBack}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Back
              </button>
              <h3 className="font-semibold text-gray-900">
                {selectedStatus === "sick" ? "🏥 Mark as Sick" : "🚫 Mark as Away"}
              </h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={selectedStatus === "sick" ? "e.g., Flu symptoms, headache..." : "e.g., Personal appointment, family emergency..."}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                rows={2}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="today">Today only</option>
                <option value="this-week">This week</option>
                <option value="next-week">Next week</option>
                <option value="until-further-notice">Until further notice</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={!reason.trim()}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Mark as {selectedStatus === "sick" ? "Sick" : "Away"}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
