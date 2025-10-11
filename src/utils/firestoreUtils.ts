/**
 * Convert Firestore timestamp to milliseconds
 */
export const convertFirestoreTimestamp = (
  timestamp: any,
  defaultValue: number = Date.now()
): number => {
  if (typeof timestamp?.toMillis === "function") {
    return timestamp.toMillis();
  }
  return timestamp || defaultValue;
};

/**
 * Convert optional Firestore timestamp to milliseconds or undefined
 */
export const convertOptionalFirestoreTimestamp = (
  timestamp: any
): number | undefined => {
  if (typeof timestamp?.toMillis === "function") {
    return timestamp.toMillis();
  }
  return timestamp;
};
