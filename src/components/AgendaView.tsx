import { useStore } from "../store";
import type { TimeSlot } from "../types";
import { isSameDayAs } from "../utils/dateUtils";
import { format } from "date-fns";

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

  const getUserName = (userId: string) => {
    return users.find((u) => u.id === userId)?.name || "Unknown";
  };

  const getStatusColor = (status: TimeSlot["status"]) => {
    switch (status) {
      case "planned":
        return "border-l-gray-400 bg-gray-50";
      case "checked-in":
        return "border-l-yellow-400 bg-yellow-50";
      case "confirmed":
        return "border-l-green-500 bg-green-50";
      case "missed":
        return "border-l-red-400 bg-red-50";
      default:
        return "border-l-gray-300 bg-gray-50";
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
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${styles[status]}`}>
        {status === "checked-in" ? "Pending" : status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

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
                sticky top-14 sm:top-16 z-10 
                px-4 py-2 rounded-lg mb-2
                ${isToday ? "bg-primary text-white" : "bg-gray-100 text-gray-900"}
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
                    ${getStatusColor(slot.status)}
                  `}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-base text-gray-900">
                          {slot.startTime}
                        </span>
                        <span className="text-gray-400">—</span>
                        <span className="text-sm text-gray-600">{slot.endTime}</span>
                      </div>
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">
                        {slot.title}
                      </h3>
                    </div>
                    {getStatusBadge(slot.status)}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <span>👤</span>
                      <span>{slot.participantIds.length} attending</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>🔒</span>
                      <span>{getUserName(slot.verifierId)}</span>
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

