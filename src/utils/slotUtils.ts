import type { TimeSlot } from "../types";

/**
 * Get status badge configuration for a time slot
 */
export const getStatusBadgeClasses = (status: TimeSlot["status"]): string => {
  const styles = {
    planned: "bg-gray-100 text-gray-700",
    "checked-in": "bg-yellow-100 text-yellow-700",
    confirmed: "bg-green-100 text-green-700",
    missed: "bg-red-100 text-red-700",
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
    default:
      return "border-l-gray-300 bg-gray-50";
  }
};

/**
 * Format status text for display
 */
export const formatStatusText = (status: TimeSlot["status"]): string => {
  if (status === "checked-in") return "Pending";
  return status.charAt(0).toUpperCase() + status.slice(1);
};
