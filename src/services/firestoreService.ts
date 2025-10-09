import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import type { TimeSlot, User } from "../types";

// Collections
const USERS_COLLECTION = "users";
const SLOTS_COLLECTION = "timeSlots";
const CONNECTIONS_COLLECTION = "connections";

// ===== USER SERVICES =====

export const createUserProfile = async (
  userId: string,
  userData: Omit<User, "id">
) => {
  try {
    await setDoc(doc(db, USERS_COLLECTION, userId), {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
};

export const getUserProfile = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as User;
    }
    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
};

export const updateUserProfile = async (
  userId: string,
  updates: Partial<User>
) => {
  try {
    await updateDoc(doc(db, USERS_COLLECTION, userId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

// ===== CONNECTION SERVICES =====

export const addConnection = async (
  userId: string,
  connectedUserId: string
) => {
  try {
    const connectionId = [userId, connectedUserId].sort().join("_");
    await setDoc(doc(db, CONNECTIONS_COLLECTION, connectionId), {
      users: [userId, connectedUserId],
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error adding connection:", error);
    throw error;
  }
};

export const getConnectedUsers = async (userId: string): Promise<User[]> => {
  try {
    const q = query(
      collection(db, CONNECTIONS_COLLECTION),
      where("users", "array-contains", userId)
    );
    const snapshot = await getDocs(q);

    const connectedUserIds = new Set<string>();
    snapshot.forEach((doc) => {
      const users = doc.data().users as string[];
      users.forEach((id) => {
        if (id !== userId) connectedUserIds.add(id);
      });
    });

    // Fetch user profiles
    const userProfiles: User[] = [];
    for (const id of connectedUserIds) {
      const user = await getUserProfile(id);
      if (user) userProfiles.push(user);
    }

    return userProfiles;
  } catch (error) {
    console.error("Error getting connected users:", error);
    return [];
  }
};

export const searchUserByEmail = async (
  email: string
): Promise<User | null> => {
  try {
    const q = query(
      collection(db, USERS_COLLECTION),
      where("email", "==", email.toLowerCase())
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0];
      return { id: userDoc.id, ...userDoc.data() } as User;
    }
    return null;
  } catch (error) {
    console.error("Error searching user:", error);
    return null;
  }
};

// ===== TIME SLOT SERVICES =====

export const createTimeSlot = async (slot: Omit<TimeSlot, "id">) => {
  try {
    const docRef = doc(collection(db, SLOTS_COLLECTION));
    const slotData = {
      ...slot,
      createdAt: Timestamp.fromMillis(slot.createdAt),
      updatedAt: Timestamp.fromMillis(slot.updatedAt),
    };

    console.log("Creating slot in Firestore:", slotData);
    await setDoc(docRef, slotData);
    console.log("Slot created successfully with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ Error creating time slot:", error);
    throw error;
  }
};

export const updateTimeSlot = async (
  slotId: string,
  updates: Partial<TimeSlot>
) => {
  try {
    // Convert timestamp fields to Timestamp objects
    const firestoreUpdates: any = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    // Convert number timestamps to Firestore Timestamps
    if (updates.checkedInAt !== undefined) {
      firestoreUpdates.checkedInAt = updates.checkedInAt
        ? Timestamp.fromMillis(updates.checkedInAt)
        : null;
    }
    if (updates.confirmedAt !== undefined) {
      firestoreUpdates.confirmedAt = updates.confirmedAt
        ? Timestamp.fromMillis(updates.confirmedAt)
        : null;
    }

    console.log("Updating slot in Firestore:", slotId, firestoreUpdates);
    await updateDoc(doc(db, SLOTS_COLLECTION, slotId), firestoreUpdates);
    console.log("✅ Slot updated successfully");
  } catch (error) {
    console.error("❌ Error updating time slot:", error);
    throw error;
  }
};

export const deleteTimeSlot = async (slotId: string) => {
  try {
    console.log("🗑️ Deleting slot from Firestore:", slotId);
    await deleteDoc(doc(db, SLOTS_COLLECTION, slotId));
    console.log("✅ Slot deleted from Firestore");
  } catch (error) {
    console.error("❌ Error deleting time slot:", error);
    throw error;
  }
};

export const subscribeToUserTimeSlots = (
  userId: string,
  callback: (slots: TimeSlot[]) => void
) => {
  // Use a Map to merge slots from both queries
  const slotsMap = new Map<string, TimeSlot>();

  const updateCallback = () => {
    const mergedSlots = Array.from(slotsMap.values());
    callback(mergedSlots);
  };

  const q1 = query(
    collection(db, SLOTS_COLLECTION),
    where("participantIds", "array-contains", userId)
  );

  const q2 = query(
    collection(db, SLOTS_COLLECTION),
    where("verifierId", "==", userId)
  );

  // Subscribe to slots where user is participant
  const unsubscribe1 = onSnapshot(
    q1,
    (snapshot) => {
      console.log(`📥 Participant slots received: ${snapshot.size} slots`);

      // Track which docs were in previous snapshot
      const currentIds = new Set<string>();

      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        const slotData = {
          id: change.doc.id,
          ...data,
          createdAt:
            typeof data.createdAt?.toMillis === "function"
              ? data.createdAt.toMillis()
              : data.createdAt || Date.now(),
          updatedAt:
            typeof data.updatedAt?.toMillis === "function"
              ? data.updatedAt.toMillis()
              : data.updatedAt || Date.now(),
          checkedInAt:
            typeof data.checkedInAt?.toMillis === "function"
              ? data.checkedInAt.toMillis()
              : data.checkedInAt,
          confirmedAt:
            typeof data.confirmedAt?.toMillis === "function"
              ? data.confirmedAt.toMillis()
              : data.confirmedAt,
        } as TimeSlot;

        if (change.type === "added" || change.type === "modified") {
          console.log(
            `${change.type === "added" ? "➕" : "📝"} Slot ${change.type}:`,
            change.doc.id
          );
          slotsMap.set(change.doc.id, slotData);
          currentIds.add(change.doc.id);
        } else if (change.type === "removed") {
          console.log("🗑️ Slot removed:", change.doc.id);
          slotsMap.delete(change.doc.id);
        }
      });

      // Also track existing docs to keep them
      snapshot.docs.forEach((doc) => currentIds.add(doc.id));

      console.log(`✅ Participant query: ${slotsMap.size} total slots in map`);
      updateCallback();
    },
    (error) => {
      console.error("❌ Error in participant subscription:", error);
    }
  );

  // Subscribe to slots where user is verifier
  const unsubscribe2 = onSnapshot(
    q2,
    (snapshot) => {
      console.log(`📥 Verifier slots received: ${snapshot.size} slots`);

      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        const slotData = {
          id: change.doc.id,
          ...data,
          createdAt:
            typeof data.createdAt?.toMillis === "function"
              ? data.createdAt.toMillis()
              : data.createdAt || Date.now(),
          updatedAt:
            typeof data.updatedAt?.toMillis === "function"
              ? data.updatedAt.toMillis()
              : data.updatedAt || Date.now(),
          checkedInAt:
            typeof data.checkedInAt?.toMillis === "function"
              ? data.checkedInAt.toMillis()
              : data.checkedInAt,
          confirmedAt:
            typeof data.confirmedAt?.toMillis === "function"
              ? data.confirmedAt.toMillis()
              : data.confirmedAt,
        } as TimeSlot;

        if (change.type === "added" || change.type === "modified") {
          console.log(
            `${change.type === "added" ? "➕" : "📝"} Verifier slot ${
              change.type
            }:`,
            change.doc.id
          );
          slotsMap.set(change.doc.id, slotData);
        } else if (change.type === "removed") {
          console.log("🗑️ Verifier slot removed:", change.doc.id);
          slotsMap.delete(change.doc.id);
        }
      });

      console.log(`✅ Total unique slots: ${slotsMap.size}`);
      updateCallback();
    },
    (error) => {
      console.error("❌ Error in verifier subscription:", error);
    }
  );

  return () => {
    unsubscribe1();
    unsubscribe2();
  };
};
