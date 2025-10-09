import { useStore } from "../store";
import type { TimeSlot } from "../types";
import {
  formatDate,
  getDayName,
  getMonthDay,
  getWeekDays,
  getWeekNumber,
  isSameDayAs,
  nextWeek,
  prevWeek,
} from "../utils/dateUtils";

interface WeekCalendarProps {
  onDayClick: (date: Date) => void;
}

export default function WeekCalendar({ onDayClick }: WeekCalendarProps) {
  const { selectedDate, setSelectedDate, timeSlots } = useStore();

  const weekDays = getWeekDays(selectedDate);
  const weekNumber = getWeekNumber(selectedDate);

  const getDaySlots = (date: Date): TimeSlot[] => {
    return timeSlots
      .filter((slot) => isSameDayAs(date, slot.date))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const handlePrevWeek = () => setSelectedDate(prevWeek(selectedDate));
  const handleNextWeek = () => setSelectedDate(nextWeek(selectedDate));
  const handleToday = () => setSelectedDate(new Date());

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Week {weekNumber}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {formatDate(weekDays[0], "MMM d")} -{" "}
            {formatDate(weekDays[6], "MMM d, yyyy")}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handlePrevWeek}
            className="btn-secondary py-1.5 px-4"
          >
            ←
          </button>
          <button onClick={handleToday} className="btn-secondary py-1.5 px-4">
            Today
          </button>
          <button
            onClick={handleNextWeek}
            className="btn-secondary py-1.5 px-4"
          >
            →
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-3">
        {weekDays.map((day) => {
          const daySlots = getDaySlots(day);
          const isToday = isSameDayAs(day, new Date());

          return (
            <div
              key={day.toString()}
              className={`
                rounded-xl border-2 transition-all min-h-[180px] flex flex-col
                ${isToday ? "border-primary bg-primary/5" : "border-gray-200"}
              `}
            >
              {/* Day Header */}
              <button
                onClick={() => onDayClick(day)}
                className="p-3 text-center hover:bg-gray-50/50 rounded-t-xl transition-colors"
              >
                <div className="text-xs font-medium text-gray-600 mb-1">
                  {getDayName(day, true)}
                </div>
                <div
                  className={`text-xl font-bold ${
                    isToday ? "text-primary" : "text-gray-900"
                  }`}
                >
                  {getMonthDay(day)}
                </div>
              </button>

              {/* Time Slot Cards */}
              <div className="flex-1 p-2 space-y-1 overflow-y-auto">
                {daySlots.slice(0, 4).map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => onDayClick(day)}
                    className={`
                      w-full text-left px-2 py-1.5 rounded-md text-xs
                      transition-all hover:shadow-sm border-l-2
                      ${
                        slot.status === "planned"
                          ? "bg-gray-100 border-gray-400 text-gray-700 hover:bg-gray-200"
                          : ""
                      }
                      ${
                        slot.status === "checked-in"
                          ? "bg-yellow-100 border-yellow-400 text-yellow-800 hover:bg-yellow-200"
                          : ""
                      }
                      ${
                        slot.status === "confirmed"
                          ? "bg-green-100 border-green-500 text-green-800 hover:bg-green-200"
                          : ""
                      }
                      ${
                        slot.status === "missed"
                          ? "bg-red-100 border-red-400 text-red-800 hover:bg-red-200"
                          : ""
                      }
                    `}
                    title={slot.title}
                  >
                    <div className="font-bold">{slot.startTime}</div>
                    <div className="truncate text-[10px] opacity-90">
                      {slot.title}
                    </div>
                  </button>
                ))}
                {daySlots.length > 4 && (
                  <button
                    onClick={() => onDayClick(day)}
                    className="w-full text-center text-xs text-gray-500 hover:text-primary py-1"
                  >
                    +{daySlots.length - 4} more
                  </button>
                )}
                {daySlots.length === 0 && (
                  <div className="text-center text-gray-400 text-xs py-4">
                    No slots
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 justify-center text-sm">
          <div className="flex items-center gap-2">
            <span className="status-dot bg-gray-400" />
            <span className="text-gray-700">Planned</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="status-dot bg-yellow-400" />
            <span className="text-gray-700">Checked-In</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="status-dot bg-accent" />
            <span className="text-gray-700">Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="status-dot bg-red-400" />
            <span className="text-gray-700">Missed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
