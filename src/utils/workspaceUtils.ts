import type { WorkspaceColor } from "../types";

export const WORKSPACE_COLORS = {
  blue: {
    hex: "#3B82F6",
    dot: "🟦",
    bgLight: "bg-blue-50",
    bgMedium: "bg-blue-100",
    border: "border-blue-400",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-700 border-blue-300",
  },
  purple: {
    hex: "#A855F7",
    dot: "🟣",
    bgLight: "bg-purple-50",
    bgMedium: "bg-purple-100",
    border: "border-purple-400",
    text: "text-purple-700",
    badge: "bg-purple-100 text-purple-700 border-purple-300",
  },
  orange: {
    hex: "#F97316",
    dot: "🟠",
    bgLight: "bg-orange-50",
    bgMedium: "bg-orange-100",
    border: "border-orange-400",
    text: "text-orange-700",
    badge: "bg-orange-100 text-orange-700 border-orange-300",
  },
  green: {
    hex: "#10B981",
    dot: "🟢",
    bgLight: "bg-green-50",
    bgMedium: "bg-green-100",
    border: "border-green-400",
    text: "text-green-700",
    badge: "bg-green-100 text-green-700 border-green-300",
  },
  red: {
    hex: "#EF4444",
    dot: "🔴",
    bgLight: "bg-red-50",
    bgMedium: "bg-red-100",
    border: "border-red-400",
    text: "text-red-700",
    badge: "bg-red-100 text-red-700 border-red-300",
  },
  yellow: {
    hex: "#EAB308",
    dot: "🟡",
    bgLight: "bg-yellow-50",
    bgMedium: "bg-yellow-100",
    border: "border-yellow-400",
    text: "text-yellow-700",
    badge: "bg-yellow-100 text-yellow-700 border-yellow-300",
  },
  pink: {
    hex: "#EC4899",
    dot: "🩷",
    bgLight: "bg-pink-50",
    bgMedium: "bg-pink-100",
    border: "border-pink-400",
    text: "text-pink-700",
    badge: "bg-pink-100 text-pink-700 border-pink-300",
  },
  teal: {
    hex: "#14B8A6",
    dot: "🔵",
    bgLight: "bg-teal-50",
    bgMedium: "bg-teal-100",
    border: "border-teal-400",
    text: "text-teal-700",
    badge: "bg-teal-100 text-teal-700 border-teal-300",
  },
} as const;

/**
 * Get color classes for a workspace
 */
export const getWorkspaceColorClasses = (color?: WorkspaceColor) => {
  return WORKSPACE_COLORS[color || "blue"];
};

/**
 * Get workspace color dot emoji
 */
export const getWorkspaceColorDot = (color?: WorkspaceColor): string => {
  return WORKSPACE_COLORS[color || "blue"].dot;
};

/**
 * Auto-assign colors to workspaces based on index
 */
export const autoAssignWorkspaceColor = (index: number): WorkspaceColor => {
  const colors: WorkspaceColor[] = ["blue", "purple", "orange", "green", "red", "yellow", "pink", "teal"];
  return colors[index % colors.length];
};

