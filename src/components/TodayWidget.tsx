import { useState } from "react";
import { useStore } from "../store";
import { isSameDayAs } from "../utils/dateUtils";
import { formatStatusText, getStatusBadgeClasses } from "../utils/slotUtils";

export default function TodayWidget() {
  const { user, allUserTimeSlots, workspaces, detectedConflicts, setViewMode } =
    useStore();
  const [isExpanded, setIsExpanded] = useState(true);

  // Get today's slots
  const todaySlots = allUserTimeSlots
    .filter((slot) => isSameDayAs(new Date(), slot.date))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .slice(0, 5);

  const todayConflicts = detectedConflicts.filter((c) =>
    isSameDayAs(new Date(), c.date)
  );

  const uniqueWorkspaces = new Set(todaySlots.map((s) => s.workspaceId)).size;

  if (todaySlots.length === 0) return null;

  return (
    <div className="card mb-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">📅</span>
          <div className="text-left">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              Today's Agenda
              {todayConflicts.length > 0 && (
                <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-bold">
                  ⚠️ {todayConflicts.length}
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-600">
              {todaySlots.length} event{todaySlots.length !== 1 ? "s" : ""}{" "}
              across {uniqueWorkspaces} workspace
              {uniqueWorkspaces !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <span className="text-gray-400 text-xl">{isExpanded ? "↑" : "↓"}</span>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="mt-4 space-y-2">
          {todaySlots.map((slot) => {
            const workspace = workspaces.find((w) => w.id === slot.workspaceId);
            const isParticipant = slot.participantIds.includes(user?.id || "");

            return (
              <div
                key={slot.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-white hover:bg-gray-50 transition-colors border border-gray-200"
              >
                <span className="font-bold text-primary text-sm flex-shrink-0">
                  {slot.startTime}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {slot.title}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="truncate">🏢 {workspace?.name}</span>
                    <span>·</span>
                    <span>{isParticipant ? "👤" : "🔒"}</span>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${getStatusBadgeClasses(
                    slot.status
                  )}`}
                >
                  {formatStatusText(slot.status)}
                </span>
              </div>
            );
          })}

          {todaySlots.length === 5 &&
            allUserTimeSlots.filter((s) => isSameDayAs(new Date(), s.date))
              .length > 5 && (
              <p className="text-xs text-center text-gray-500 pt-2">
                +
                {allUserTimeSlots.filter((s) => isSameDayAs(new Date(), s.date))
                  .length - 5}{" "}
                more events today
              </p>
            )}

          <button
            onClick={() => setViewMode("my-agenda")}
            className="w-full text-sm text-primary font-medium hover:underline mt-2 py-2"
          >
            View Full Agenda →
          </button>
        </div>
      )}
    </div>
  );
}
