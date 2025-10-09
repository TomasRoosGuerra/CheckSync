import { subDays } from "date-fns";
import { useState } from "react";
import { useStore } from "../store";
import type { ExportFilter } from "../types";
import { formatDate } from "../utils/dateUtils";
import { exportToCSV } from "../utils/exportUtils";

interface ExportProps {
  onClose: () => void;
}

export default function Export({ onClose }: ExportProps) {
  const { timeSlots, users } = useStore();

  const [startDate, setStartDate] = useState(
    formatDate(subDays(new Date(), 30))
  );
  const [endDate, setEndDate] = useState(formatDate(new Date()));
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    []
  );
  const [confirmedOnly, setConfirmedOnly] = useState(false);

  const handleExport = () => {
    const filter: ExportFilter = {
      startDate,
      endDate,
      participantIds:
        selectedParticipants.length > 0 ? selectedParticipants : undefined,
      confirmedOnly,
    };

    exportToCSV(timeSlots, users, filter);
    onClose();
  };

  const toggleParticipant = (userId: string) => {
    if (selectedParticipants.includes(userId)) {
      setSelectedParticipants(
        selectedParticipants.filter((id) => id !== userId)
      );
    } else {
      setSelectedParticipants([...selectedParticipants, userId]);
    }
  };

  const getFilteredCount = () => {
    return timeSlots.filter((slot) => {
      const slotDateStr = slot.date;
      const dateMatch = slotDateStr >= startDate && slotDateStr <= endDate;
      const participantMatch =
        selectedParticipants.length === 0 ||
        selectedParticipants.some((id) => slot.participantIds.includes(id));
      const statusMatch = !confirmedOnly || slot.status === "confirmed";
      return dateMatch && participantMatch && statusMatch;
    }).length;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Export Data</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input-field text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">From</p>
                </div>
                <div>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="input-field text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">To</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Participants (optional)
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {users.map((u) => (
                  <label
                    key={u.id}
                    className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedParticipants.includes(u.id)}
                      onChange={() => toggleParticipant(u.id)}
                      className="w-4 h-4 text-primary rounded focus:ring-primary"
                    />
                    <span className="flex-1">{u.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={confirmedOnly}
                  onChange={(e) => setConfirmedOnly(e.target.checked)}
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    Confirmed only
                  </div>
                  <div className="text-sm text-gray-500">
                    Export only confirmed attendance records
                  </div>
                </div>
              </label>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-primary mb-1">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-medium">Export Summary</span>
              </div>
              <p className="text-sm text-gray-700">
                {getFilteredCount()} record{getFilteredCount() !== 1 ? "s" : ""}{" "}
                will be exported
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleExport}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export CSV
              </button>
              <button onClick={onClose} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
