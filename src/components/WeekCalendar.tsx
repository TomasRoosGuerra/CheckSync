import { useStore } from "../store";
import type { TimeSlot } from "../types";
import {
  formatDate,
  getDayName,
  getExtendedWeekDays,
  getMonthDay,
  getWeekDays,
  getWeekNumber,
  isSameDayAs,
  nextWeek,
  prevWeek,
} from "../utils/dateUtils";
import { getOverlapInfo, groupOverlappingSlots } from "../utils/slotUtils";

interface WeekCalendarProps {
  onDayClick: (date: Date) => void;
}

export default function WeekCalendar({ onDayClick }: WeekCalendarProps) {
  const { selectedDate, setSelectedDate, timeSlots } = useStore();

  const weekDays = getWeekDays(selectedDate);
  const extendedWeekDays = getExtendedWeekDays(selectedDate);
  const weekNumber = getWeekNumber(selectedDate);

  const getDaySlots = (date: Date): TimeSlot[][] => {
    const daySlots = timeSlots
      .filter((slot) => isSameDayAs(date, slot.date))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    return groupOverlappingSlots(daySlots);
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
        className="overflow-x-auto sm:overflow-x-visible 
                      flex sm:grid sm:grid-cols-7 gap-3 sm:gap-2 md:gap-3 
                      pb-2 sm:pb-0 -mx-2 px-2 sm:mx-0 sm:px-0
                      snap-x snap-mandatory sm:snap-none"
      >
        {/* Mobile: Extended view with partial days */}
        <div className="sm:hidden">
          {extendedWeekDays.map((day, index) => {
            const daySlotGroups = getDaySlots(day);
            const isToday = isSameDayAs(day, new Date());
            const totalSlots = daySlotGroups.flat().length;
            const isMainWeek = index >= 1 && index <= 7; // Days 1-7 are the main week

            return (
              <div
                key={day.toString()}
                className={`
                  flex-shrink-0 w-[85vw]
                  snap-center
                  rounded-xl border-2 transition-all 
                  min-h-[240px]
                  flex flex-col
                  ${
                    isMainWeek
                      ? "border-gray-200"
                      : "border-gray-100 opacity-60"
                  }
                  ${isToday ? "border-primary bg-primary/5 shadow-lg" : ""}
                `}
              >
                {/* Day Header */}
                <button
                  onClick={() => onDayClick(day)}
                  className={`
                    p-4 text-center rounded-t-xl transition-all touch-manipulation
                    ${
                      totalSlots === 0
                        ? "hover:bg-primary/5 active:bg-primary/10 border-b border-dashed border-primary/30"
                        : "hover:bg-gray-50/50 active:bg-gray-100"
                    }
                  `}
                >
                  <div className="text-xs font-medium text-gray-600 mb-1">
                    {getDayName(day, false)}
                  </div>
                  <div
                    className={`text-2xl font-bold ${
                      isToday ? "text-primary" : "text-gray-900"
                    }`}
                  >
                    {getMonthDay(day)}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    {formatDate(day, "MMM yyyy")}
                  </div>
                  {!isMainWeek && (
                    <div className="text-[8px] text-gray-400 mt-1">
                      {index === 0 ? "Prev" : "Next"}
                    </div>
                  )}
                </button>

                {/* Time Slot Cards */}
                <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                  {isMainWeek ? (
                    // Show full slots for main week
                    <>
                      {daySlotGroups
                        .slice(0, 5)
                        .map((slotGroup, groupIndex) => (
                          <div key={`group-${groupIndex}`} className="relative">
                            {slotGroup.length > 1 && (
                              <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold z-10">
                                {slotGroup.length}
                              </div>
                            )}
                            {slotGroup.map((slot) => {
                              const overlapInfo = getOverlapInfo(
                                slot,
                                slotGroup
                              );
                              return (
                                <button
                                  key={slot.id}
                                  onClick={() => onDayClick(day)}
                                  className={`
                                  w-full text-left px-3 py-2.5 
                                  rounded-lg text-sm
                                  transition-all hover:shadow-md active:scale-98
                                  border-l-3 font-medium
                                  touch-manipulation min-h-[52px]
                                  ${slotGroup.length > 1 ? "mb-1" : ""}
                                  ${
                                    overlapInfo.offset > 0
                                      ? "ml-2 opacity-90"
                                      : ""
                                  }
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
                                  style={{
                                    width:
                                      slotGroup.length > 1
                                        ? `${overlapInfo.width}%`
                                        : "100%",
                                    marginLeft:
                                      overlapInfo.offset > 0
                                        ? `${overlapInfo.offset}px`
                                        : "0",
                                  }}
                                  title={`${slot.title}${
                                    slotGroup.length > 1
                                      ? ` (${slotGroup.length} overlapping)`
                                      : ""
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="font-bold text-sm mb-0.5">
                                      {slot.startTime}
                                    </div>
                                    {slotGroup.length > 1 && (
                                      <div className="text-xs opacity-60">
                                        📋
                                      </div>
                                    )}
                                  </div>
                                  <div className="truncate text-xs opacity-90">
                                    {slot.title}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ))}
                      {totalSlots > 5 && (
                        <button
                          onClick={() => onDayClick(day)}
                          className="w-full text-center text-xs text-gray-500 hover:text-primary active:text-primary-dark py-2 font-semibold touch-manipulation"
                        >
                          +{totalSlots - 5} more
                        </button>
                      )}
                    </>
                  ) : (
                    // Show limited slots for partial days
                    <>
                      {daySlotGroups.slice(0, 2).map((slotGroup) =>
                        slotGroup.slice(0, 1).map((slot) => (
                          <button
                            key={slot.id}
                            onClick={() => onDayClick(day)}
                            className="w-full text-left px-2 py-1 rounded text-xs opacity-75"
                            title={slot.title}
                          >
                            <div className="font-bold text-xs">
                              {slot.startTime}
                            </div>
                            <div className="truncate text-[10px]">
                              {slot.title}
                            </div>
                          </button>
                        ))
                      )}
                      {totalSlots > 2 && (
                        <div className="text-[10px] text-gray-400 text-center">
                          +{totalSlots - 2} more
                        </div>
                      )}
                    </>
                  )}
                  {totalSlots === 0 && (
                    <button
                      onClick={() => onDayClick(day)}
                      className="w-full text-center text-gray-400 py-4 hover:text-primary active:text-primary-dark transition-colors touch-manipulation"
                    >
                      <div className="text-2xl mb-1 opacity-40">➕</div>
                      <div className="text-[10px] font-medium opacity-60">
                        Tap to add
                      </div>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop: Standard week view */}
        <div className="hidden sm:contents">
          {weekDays.map((day) => {
            const daySlotGroups = getDaySlots(day);
            const isToday = isSameDayAs(day, new Date());
            const totalSlots = daySlotGroups.flat().length;

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
                    totalSlots === 0
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
                  {daySlotGroups.slice(0, 5).map((slotGroup, groupIndex) => (
                    <div key={`group-${groupIndex}`} className="relative">
                      {slotGroup.length > 1 && (
                        <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold z-10">
                          {slotGroup.length}
                        </div>
                      )}
                      {slotGroup.map((slot) => {
                        const overlapInfo = getOverlapInfo(slot, slotGroup);
                        return (
                          <button
                            key={slot.id}
                            onClick={() => onDayClick(day)}
                            className={`
                            w-full text-left px-3 sm:px-2 py-2.5 sm:py-2 
                            rounded-lg sm:rounded-md text-sm sm:text-xs
                            transition-all hover:shadow-md active:scale-98
                            border-l-3 font-medium
                            touch-manipulation min-h-[52px] sm:min-h-auto
                            ${slotGroup.length > 1 ? "mb-1" : ""}
                            ${overlapInfo.offset > 0 ? "ml-2 opacity-90" : ""}
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
                            style={{
                              width:
                                slotGroup.length > 1
                                  ? `${overlapInfo.width}%`
                                  : "100%",
                              marginLeft:
                                overlapInfo.offset > 0
                                  ? `${overlapInfo.offset}px`
                                  : "0",
                            }}
                            title={`${slot.title}${
                              slotGroup.length > 1
                                ? ` (${slotGroup.length} overlapping)`
                                : ""
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="font-bold text-sm sm:text-xs mb-0.5">
                                {slot.startTime}
                              </div>
                              {slotGroup.length > 1 && (
                                <div className="text-xs opacity-60">📋</div>
                              )}
                            </div>
                            <div className="truncate text-xs sm:text-[10px] opacity-90">
                              {slot.title}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                  {totalSlots > 5 && (
                    <button
                      onClick={() => onDayClick(day)}
                      className="w-full text-center text-xs sm:text-xs text-gray-500 hover:text-primary active:text-primary-dark py-2 font-semibold touch-manipulation"
                    >
                      +{totalSlots - 5} more
                    </button>
                  )}
                  {totalSlots === 0 && (
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
