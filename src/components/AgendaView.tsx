import { format } from "date-fns";
import { useStore } from "../store";
import type { TimeSlot } from "../types";
import { isSameDayAs } from "../utils/dateUtils";
import {
  formatStatusText,
  getStatusBadgeClasses,
  getStatusColorClasses,
} from "../utils/slotUtils";
import { getUserName } from "../utils/userUtils";

interface AgendaViewProps {
  onSlotClick: (date: Date) => void;
}

export default function AgendaView({ onSlotClick }: AgendaViewProps) {
  const { timeSlots, users } = useStore();

  // Get all slots sorted by date and time
  const sortedSlots = [...timeSlots].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.startTime.localeCompare(b.startTime);
  });

  // Group by day
  const groupedSlots = sortedSlots.reduce((acc, slot) => {
    if (!acc[slot.date]) {
      acc[slot.date] = [];
    }
    acc[slot.date].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);

  return (
    <div className="space-y-4">
      {Object.entries(groupedSlots).map(([date, slots]) => {
        const dayDate = new Date(date + "T00:00:00");
        const isToday = isSameDayAs(dayDate, new Date());

        return (
          <div key={date}>
            {/* Date Header */}
            <div
              className={`
                sticky-mobile top-14 sm:top-16 z-10 
                px-4 py-2 rounded-lg mb-2
                ${
                  isToday
                    ? "bg-primary text-gray-900"
                    : "bg-gray-100 text-gray-900"
                }
              `}
            >
              <div className="font-bold text-sm">
                {format(dayDate, "EEEE, MMMM d")}
              </div>
            </div>

            {/* Slots for this day */}
            <div className="space-y-2">
              {slots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => onSlotClick(dayDate)}
                  className={`
                    w-full text-left p-4 rounded-xl border-l-4
                    transition-all hover:shadow-md active:scale-99
                    touch-manipulation
                    ${getStatusColorClasses(slot.status)}
                  `}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-base text-gray-900">
                          {slot.startTime}
                        </span>
                        <span className="text-gray-400">—</span>
                        <span className="text-sm text-gray-600">
                          {slot.endTime}
                        </span>
                      </div>
                      <h3 className="font-semibold text-lg text-gray-900 mb-0.5">
                        {slot.title}
                      </h3>
                      {slot.subtitle && (
                        <p className="text-sm text-gray-700">{slot.subtitle}</p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusBadgeClasses(
                        slot.status
                      )}`}
                    >
                      {formatStatusText(slot.status)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <span>👤</span>
                      <span>{slot.participantIds.length} attending</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>🔒</span>
                      <span>{getUserName(slot.verifierId, users)}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {sortedSlots.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-base font-medium">No time slots scheduled</p>
          <p className="text-sm text-gray-400 mt-1">
            Add your first slot to get started
          </p>
        </div>
      )}
    </div>
  );
}
