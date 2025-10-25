import { useState } from "react";
import { updateTimeSlot as updateSlotFirestore } from "../services/firestoreService";
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
import { canCheckIn } from "../utils/permissions";
import { getOverlapInfo, groupOverlappingSlots } from "../utils/slotUtils";
import StatusContextMenu from "./StatusContextMenu";

interface WeekCalendarProps {
  onDayClick: (date: Date) => void;
}

export default function WeekCalendar({ onDayClick }: WeekCalendarProps) {
  const { selectedDate, setSelectedDate, timeSlots, user } = useStore();

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    slot: TimeSlot | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    slot: null,
  });

  const weekDays = getWeekDays(selectedDate);
  const weekNumber = getWeekNumber(selectedDate);

  // Context menu handlers
  const handleSlotLongPress = (e: React.MouseEvent, slot: TimeSlot) => {
    e.preventDefault();
    e.stopPropagation();

    if (!canCheckIn(user, slot)) return;

    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      slot,
    });
  };

  const handleStatusChange = async (
    status: "sick" | "away",
    reason: string,
    duration: string
  ) => {
    if (!contextMenu.slot) return;

    try {
      const updates = {
        status: status,
        sickAwayReason: reason,
        sickAwayDuration: duration,
        sickAwayAt: Date.now(),
      };
      await updateSlotFirestore(contextMenu.slot.id, updates);
      console.log(`✅ Marked slot as ${status}: ${reason}`);
    } catch (error) {
      console.error("Error updating slot status:", error);
      alert("Failed to update status. Please try again.");
    }
  };

  const closeContextMenu = () => {
    setContextMenu({
      isOpen: false,
      position: { x: 0, y: 0 },
      slot: null,
    });
  };

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

      {/* Enhanced Horizontal Scroll Layout - All Screen Sizes */}
      <div
        className="overflow-x-auto 
                      flex gap-4 
                      pb-4 -mx-4 px-4
                      snap-x snap-mandatory
                      scrollbar-hide"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {/* Enhanced Day Cards with Better Visual Hierarchy */}
        {weekDays.map((day, index) => {
          const daySlotGroups = getDaySlots(day);
          const isToday = isSameDayAs(day, new Date());
          const totalSlots = daySlotGroups.flat().length;
          const isWeekend = index === 0 || index === 6; // Sunday or Saturday

          return (
            <div
              key={day.toString()}
              className={`
                flex-shrink-0 w-[280px] sm:w-[320px] md:w-[360px] lg:w-[400px]
                snap-center
                rounded-2xl border-2 transition-all duration-300
                min-h-[320px] sm:min-h-[360px] md:min-h-[400px]
                flex flex-col
                shadow-lg hover:shadow-xl
                ${
                  isToday
                    ? "border-primary bg-gradient-to-br from-primary/5 to-primary/10 shadow-primary/20"
                    : isWeekend
                    ? "border-gray-200 bg-gradient-to-br from-gray-50/50 to-gray-100/30"
                    : "border-gray-200 bg-white"
                }
                hover:scale-[1.02] hover:border-primary/30
                group
              `}
            >
              {/* Enhanced Day Header */}
              <button
                onClick={() => onDayClick(day)}
                className={`
                  p-5 sm:p-6 text-center rounded-t-2xl transition-all touch-manipulation
                  relative overflow-hidden
                  ${
                    totalSlots === 0
                      ? "hover:bg-primary/10 active:bg-primary/15 border-b-2 border-dashed border-primary/40"
                      : "hover:bg-gray-50/80 active:bg-gray-100/80"
                  }
                `}
                aria-label={`View ${getDayName(day)} ${getMonthDay(
                  day
                )} schedule`}
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity">
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-transparent"></div>
                </div>

                <div className="relative z-10">
                  <div className="text-xs sm:text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                    {getDayName(day, false)}
                  </div>
                  <div
                    className={`text-3xl sm:text-4xl font-bold mb-2 ${
                      isToday ? "text-primary" : "text-gray-900"
                    }`}
                  >
                    {getMonthDay(day)}
                  </div>
                  <div className="text-xs text-gray-500 mb-1">
                    {formatDate(day, "MMM yyyy")}
                  </div>

                  {/* Event Count Badge */}
                  {totalSlots > 0 && (
                    <div
                      className={`
                      inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                      ${
                        isToday
                          ? "bg-primary text-white"
                          : "bg-gray-200 text-gray-700"
                      }
                    `}
                    >
                      <span className="mr-1">📅</span>
                      {totalSlots} event{totalSlots !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              </button>

              {/* Enhanced Time Slot Cards */}
              <div className="flex-1 p-4 sm:p-5 space-y-3 overflow-y-auto">
                {daySlotGroups.slice(0, 6).map((slotGroup, groupIndex) => (
                  <div key={`group-${groupIndex}`} className="relative">
                    {slotGroup.length > 1 && (
                      <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold z-10 shadow-lg">
                        {slotGroup.length}
                      </div>
                    )}
                    {slotGroup.map((slot) => {
                      const overlapInfo = getOverlapInfo(slot, slotGroup);
                      return (
                        <button
                          key={slot.id}
                          onClick={() => onDayClick(day)}
                          onContextMenu={(e) => handleSlotLongPress(e, slot)}
                          className={`
                            w-full text-left px-4 py-3 
                            rounded-xl text-sm
                            transition-all duration-200 hover:shadow-lg active:scale-[0.98]
                            border-l-4 font-medium
                            touch-manipulation min-h-[60px]
                            ${slotGroup.length > 1 ? "mb-2" : ""}
                            ${overlapInfo.offset > 0 ? "ml-3 opacity-90" : ""}
                            ${
                              slot.status === "planned"
                                ? "bg-gray-100 border-gray-400 text-gray-700 hover:bg-gray-200 active:bg-gray-300"
                                : ""
                            }
                            ${
                              slot.status === "checked-in"
                                ? "bg-yellow-100 border-yellow-400 text-yellow-800 hover:bg-yellow-200 active:bg-yellow-300"
                                : ""
                            }
                            ${
                              slot.status === "confirmed"
                                ? "bg-green-100 border-green-500 text-green-800 hover:bg-green-200 active:bg-green-300"
                                : ""
                            }
                            ${
                              slot.status === "missed"
                                ? "bg-red-100 border-red-400 text-red-800 hover:bg-red-200 active:bg-red-300"
                                : ""
                            }
                            ${
                              slot.status === "sick"
                                ? "bg-orange-100 border-orange-400 text-orange-800 hover:bg-orange-200 active:bg-orange-300"
                                : ""
                            }
                            ${
                              slot.status === "away"
                                ? "bg-orange-100 border-orange-400 text-orange-800 hover:bg-orange-200 active:bg-orange-300"
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
                          aria-label={`${slot.title} at ${slot.startTime}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="font-bold text-sm">
                              {slot.startTime}
                            </div>
                            {slotGroup.length > 1 && (
                              <div className="text-xs opacity-60">📋</div>
                            )}
                          </div>
                          <div className="truncate text-sm font-medium opacity-90">
                            {slot.title}
                          </div>
                          {slot.notes && (
                            <div className="text-xs text-gray-600 mt-1 truncate">
                              {slot.notes}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}

                {totalSlots > 6 && (
                  <button
                    onClick={() => onDayClick(day)}
                    className="w-full text-center text-sm text-gray-500 hover:text-primary active:text-primary-dark py-3 font-semibold touch-manipulation bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    +{totalSlots - 6} more events
                  </button>
                )}

                {totalSlots === 0 && (
                  <button
                    onClick={() => onDayClick(day)}
                    className="w-full text-center text-gray-400 py-8 hover:text-primary active:text-primary-dark transition-colors touch-manipulation rounded-xl hover:bg-gray-50"
                  >
                    <div className="text-4xl mb-3 opacity-40">➕</div>
                    <div className="text-sm font-medium opacity-60">
                      Tap to add event
                    </div>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Universal Swipe Indicator */}
      <div className="text-center mt-4 text-sm text-gray-500">
        <div className="flex items-center justify-center gap-2">
          <span className="text-lg">👆</span>
          <span>Swipe or scroll to see all days</span>
          <span className="text-lg">👆</span>
        </div>
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
            <span className="status-dot bg-orange-400" />
            <span className="text-gray-700">Sick/Away</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="status-dot bg-red-400" />
            <span className="text-gray-700">Missed</span>
          </div>
        </div>
      </div>

      {/* Status Context Menu */}
      {contextMenu.isOpen && contextMenu.slot && (
        <StatusContextMenu
          slot={contextMenu.slot}
          isOpen={contextMenu.isOpen}
          position={contextMenu.position}
          onClose={closeContextMenu}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
