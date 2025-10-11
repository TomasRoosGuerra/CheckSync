import type { User } from "../types";

/**
 * Get user name by ID from users array
 */
export const getUserName = (userId: string, users: User[]): string => {
  return users.find((u) => u.id === userId)?.name || "Unknown";
};

/**
 * Get user by ID from users array
 */
export const getUserById = (
  userId: string,
  users: User[]
): User | undefined => {
  return users.find((u) => u.id === userId);
};

/**
 * Get multiple user names by IDs
 */
export const getUserNames = (userIds: string[], users: User[]): string[] => {
  return userIds.map((id) => getUserName(id, users));
};
