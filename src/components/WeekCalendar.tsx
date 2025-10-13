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
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Week {weekNumber}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            {formatDate(weekDays[0], "MMM d")} -{" "}
            {formatDate(weekDays[6], "MMM d, yyyy")}
          </p>
        </div>

        <div className="flex gap-2 justify-center sm:justify-end">
          <button
            onClick={handlePrevWeek}
            className="btn-secondary py-2 px-4 sm:py-1.5 text-base sm:text-sm min-w-[44px]"
          >
            ←
          </button>
          <button
            onClick={handleToday}
            className="btn-secondary py-2 px-4 sm:py-1.5 text-base sm:text-sm"
          >
            Today
          </button>
          <button
            onClick={handleNextWeek}
            className="btn-secondary py-2 px-4 sm:py-1.5 text-base sm:text-sm min-w-[44px]"
          >
            →
          </button>
        </div>
      </div>

      {/* Mobile: Horizontal Scroll | Desktop: Grid */}
      <div
        className="sm:grid sm:grid-cols-7 sm:gap-2 md:gap-3 
                      overflow-x-auto sm:overflow-x-visible 
                      flex sm:block gap-3 sm:gap-0 
                      pb-2 sm:pb-0 -mx-2 px-2 sm:mx-0 sm:px-0
                      snap-x snap-mandatory sm:snap-none"
      >
        {weekDays.map((day) => {
          const daySlots = getDaySlots(day);
          const isToday = isSameDayAs(day, new Date());

          return (
            <div
              key={day.toString()}
              className={`
                flex-shrink-0 w-[85vw] sm:w-auto
                snap-center sm:snap-none
                rounded-xl border-2 transition-all 
                min-h-[240px] sm:min-h-[180px] md:min-h-[200px] 
                flex flex-col
                ${
                  isToday
                    ? "border-primary bg-primary/5 shadow-lg sm:shadow-none"
                    : "border-gray-200"
                }
              `}
            >
              {/* Day Header */}
              <button
                onClick={() => onDayClick(day)}
                className={`
                  p-4 sm:p-3 text-center rounded-t-xl transition-all touch-manipulation
                  ${
                    daySlots.length === 0
                      ? "hover:bg-primary/5 active:bg-primary/10 border-b border-dashed border-primary/30"
                      : "hover:bg-gray-50/50 active:bg-gray-100"
                  }
                `}
              >
                <div className="text-xs font-medium text-gray-600 mb-1">
                  {getDayName(day, false)}
                </div>
                <div
                  className={`text-2xl sm:text-xl md:text-2xl font-bold ${
                    isToday ? "text-primary" : "text-gray-900"
                  }`}
                >
                  {getMonthDay(day)}
                </div>
                <div className="text-[10px] sm:hidden text-gray-500 mt-1">
                  {formatDate(day, "MMM yyyy")}
                </div>
              </button>

              {/* Time Slot Cards */}
              <div className="flex-1 p-3 sm:p-2 space-y-2 sm:space-y-1 overflow-y-auto">
                {daySlots.slice(0, 5).map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => onDayClick(day)}
                    className={`
                      w-full text-left px-3 sm:px-2 py-2.5 sm:py-2 
                      rounded-lg sm:rounded-md text-sm sm:text-xs
                      transition-all hover:shadow-md active:scale-98
                      border-l-3 font-medium
                      touch-manipulation min-h-[52px] sm:min-h-auto
                      ${
                        slot.status === "planned"
                          ? "bg-gray-100 border-gray-400 text-gray-700 active:bg-gray-200"
                          : ""
                      }
                      ${
                        slot.status === "checked-in"
                          ? "bg-yellow-100 border-yellow-400 text-yellow-800 active:bg-yellow-200"
                          : ""
                      }
                      ${
                        slot.status === "confirmed"
                          ? "bg-green-100 border-green-500 text-green-800 active:bg-green-200"
                          : ""
                      }
                      ${
                        slot.status === "missed"
                          ? "bg-red-100 border-red-400 text-red-800 active:bg-red-200"
                          : ""
                      }
                    `}
                    title={slot.title}
                  >
                    <div className="font-bold text-sm sm:text-xs mb-0.5">
                      {slot.startTime}
                    </div>
                    <div className="truncate text-xs sm:text-[10px] opacity-90">
                      {slot.title}
                    </div>
                  </button>
                ))}
                {daySlots.length > 5 && (
                  <button
                    onClick={() => onDayClick(day)}
                    className="w-full text-center text-xs sm:text-xs text-gray-500 hover:text-primary active:text-primary-dark py-2 font-semibold touch-manipulation"
                  >
                    +{daySlots.length - 5} more
                  </button>
                )}
                {daySlots.length === 0 && (
                  <button
                    onClick={() => onDayClick(day)}
                    className="w-full text-center text-gray-400 py-4 sm:py-3 hover:text-primary active:text-primary-dark transition-colors touch-manipulation"
                  >
                    <div className="text-2xl sm:text-xl mb-1 opacity-40">
                      ➕
                    </div>
                    <div className="text-[10px] sm:text-[9px] font-medium opacity-60">
                      Tap to add
                    </div>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Swipe Indicator */}
      <div className="sm:hidden text-center mt-3 text-xs text-gray-400">
        ← Swipe to see all days →
      </div>

      {/* Add Time Slot CTA */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-center mb-4">
          <button
            onClick={() => onDayClick(new Date())}
            className="btn-primary text-base sm:text-sm py-4 sm:py-3 px-8 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all touch-manipulation inline-flex items-center gap-2"
          >
            <span className="text-2xl sm:text-xl">➕</span>
            <span className="font-semibold">Add Time Slot</span>
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Tap any day above or click here to schedule
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 sm:gap-4 justify-center text-xs sm:text-sm pt-3 border-t border-gray-100">
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
