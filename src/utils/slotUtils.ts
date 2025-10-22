import type { TimeSlot } from "../types";

/**
 * Check if two time slots overlap
 */
export const slotsOverlap = (slot1: TimeSlot, slot2: TimeSlot): boolean => {
  if (slot1.date !== slot2.date) return false;

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const start1 = timeToMinutes(slot1.startTime);
  const end1 = timeToMinutes(slot1.endTime);
  const start2 = timeToMinutes(slot2.startTime);
  const end2 = timeToMinutes(slot2.endTime);

  return start1 < end2 && start2 < end1;
};

/**
 * Group overlapping slots together
 */
export const groupOverlappingSlots = (slots: TimeSlot[]): TimeSlot[][] => {
  if (slots.length === 0) return [];

  const groups: TimeSlot[][] = [];
  const processed = new Set<string>();

  for (const slot of slots) {
    if (processed.has(slot.id)) continue;

    const group = [slot];
    processed.add(slot.id);

    // Find all slots that overlap with this one
    for (const otherSlot of slots) {
      if (processed.has(otherSlot.id)) continue;

      if (slotsOverlap(slot, otherSlot)) {
        group.push(otherSlot);
        processed.add(otherSlot.id);
      }
    }

    groups.push(group);
  }

  return groups;
};

/**
 * Calculate overlap percentage for visual display
 */
export const getOverlapInfo = (
  slot: TimeSlot,
  overlappingSlots: TimeSlot[]
): {
  index: number;
  total: number;
  width: number;
  offset: number;
} => {
  const sortedSlots = overlappingSlots.sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );
  const index = sortedSlots.findIndex((s) => s.id === slot.id);

  // For better visual stacking, use full width with slight offsets
  const width = 100;
  const offset = index * 3; // Small offset for visual separation

  return {
    index,
    total: overlappingSlots.length,
    width,
    offset,
  };
};

/**
 * Get status badge configuration for a time slot
 */
export const getStatusBadgeClasses = (status: TimeSlot["status"]): string => {
  const styles = {
    planned: "bg-gray-100 text-gray-700",
    "checked-in": "bg-yellow-100 text-yellow-700",
    confirmed: "bg-green-100 text-green-700",
    missed: "bg-red-100 text-red-700",
    sick: "bg-orange-100 text-orange-700",
    away: "bg-orange-100 text-orange-700",
  };
  return styles[status];
};

/**
 * Get status color classes for slot borders/backgrounds
 */
export const getStatusColorClasses = (status: TimeSlot["status"]): string => {
  switch (status) {
    case "planned":
      return "border-l-gray-400 bg-gray-50";
    case "checked-in":
      return "border-l-yellow-400 bg-yellow-50";
    case "confirmed":
      return "border-l-green-500 bg-green-50";
    case "missed":
      return "border-l-red-400 bg-red-50";
    case "sick":
      return "border-l-orange-400 bg-orange-50";
    case "away":
      return "border-l-orange-400 bg-orange-50";
    default:
      return "border-l-gray-300 bg-gray-50";
  }
};

/**
 * Format status text for display
 */
export const formatStatusText = (status: TimeSlot["status"]): string => {
  if (status === "checked-in") return "Pending";
  if (status === "sick") return "Sick";
  if (status === "away") return "Away";
  return status.charAt(0).toUpperCase() + status.slice(1);
};
