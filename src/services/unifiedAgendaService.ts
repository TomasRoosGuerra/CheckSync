import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import type { TimeConflict, TimeSlot } from "../types";
import {
  convertFirestoreTimestamp,
  convertOptionalFirestoreTimestamp,
} from "../utils/firestoreUtils";

/**
 * Subscribe to ALL time slots across user's workspaces where they are participant or verifier
 */
export const subscribeToAllUserTimeSlots = (
  userId: string,
  workspaceIds: string[],
  callback: (slots: TimeSlot[]) => void
): (() => void) => {
  if (workspaceIds.length === 0) {
    callback([]);
    return () => {};
  }

  const unsubscribers: (() => void)[] = [];
  const allSlotsMap = new Map<string, TimeSlot>();

  const updateCallback = () => {
    callback(Array.from(allSlotsMap.values()));
  };

  workspaceIds.forEach((workspaceId) => {
    // Query slots where user is participant
    const participantQuery = query(
      collection(db, "timeSlots"),
      where("workspaceId", "==", workspaceId),
      where("participantIds", "array-contains", userId)
    );

    // Query slots where user is verifier
    const verifierQuery = query(
      collection(db, "timeSlots"),
      where("workspaceId", "==", workspaceId),
      where("verifierId", "==", userId)
    );

    // Subscribe to participant slots
    const unsub1 = onSnapshot(participantQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        const slotData = {
          id: change.doc.id,
          ...data,
          createdAt: convertFirestoreTimestamp(data.createdAt),
          updatedAt: convertFirestoreTimestamp(data.updatedAt),
          checkedInAt: convertOptionalFirestoreTimestamp(data.checkedInAt),
          confirmedAt: convertOptionalFirestoreTimestamp(data.confirmedAt),
        } as TimeSlot;

        if (change.type === "added" || change.type === "modified") {
          allSlotsMap.set(change.doc.id, slotData);
        } else if (change.type === "removed") {
          allSlotsMap.delete(change.doc.id);
        }
      });
      updateCallback();
    });

    // Subscribe to verifier slots
    const unsub2 = onSnapshot(verifierQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        const slotData = {
          id: change.doc.id,
          ...data,
          createdAt: convertFirestoreTimestamp(data.createdAt),
          updatedAt: convertFirestoreTimestamp(data.updatedAt),
          checkedInAt: convertOptionalFirestoreTimestamp(data.checkedInAt),
          confirmedAt: convertOptionalFirestoreTimestamp(data.confirmedAt),
        } as TimeSlot;

        if (change.type === "added" || change.type === "modified") {
          allSlotsMap.set(change.doc.id, slotData);
        } else if (change.type === "removed") {
          allSlotsMap.delete(change.doc.id);
        }
      });
      updateCallback();
    });

    unsubscribers.push(unsub1, unsub2);
  });

  return () => unsubscribers.forEach((unsub) => unsub());
};

/**
 * Detect time conflicts across different workspaces
 */
export const detectTimeConflicts = (slots: TimeSlot[]): TimeConflict[] => {
  const conflicts: TimeConflict[] = [];

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (mins: number): string => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i];
      const b = slots[j];

      // Same date?
      if (a.date !== b.date) continue;

      // Different workspaces?
      if (a.workspaceId === b.workspaceId) continue;

      // Calculate time overlap
      const aStart = timeToMinutes(a.startTime);
      const aEnd = timeToMinutes(a.endTime);
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);

      // Check for overlap
      if (aStart < bEnd && bStart < aEnd) {
        const overlapStart = Math.max(aStart, bStart);
        const overlapEnd = Math.min(aEnd, bEnd);
        const overlapMinutes = overlapEnd - overlapStart;

        conflicts.push({
          id: `conflict-${a.id}-${b.id}`,
          slot1Id: a.id,
          slot2Id: b.id,
          workspace1Id: a.workspaceId,
          workspace2Id: b.workspaceId,
          date: a.date,
          overlapStart: minutesToTime(overlapStart),
          overlapEnd: minutesToTime(overlapEnd),
          overlapMinutes,
        });
      }
    }
  }

  return conflicts;
};
