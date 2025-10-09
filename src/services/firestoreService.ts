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
    await setDoc(docRef, {
      ...slot,
      createdAt: Timestamp.fromMillis(slot.createdAt),
      updatedAt: Timestamp.fromMillis(slot.updatedAt),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating time slot:", error);
    throw error;
  }
};

export const updateTimeSlot = async (
  slotId: string,
  updates: Partial<TimeSlot>
) => {
  try {
    await updateDoc(doc(db, SLOTS_COLLECTION, slotId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating time slot:", error);
    throw error;
  }
};

export const deleteTimeSlot = async (slotId: string) => {
  try {
    await deleteDoc(doc(db, SLOTS_COLLECTION, slotId));
  } catch (error) {
    console.error("Error deleting time slot:", error);
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
  const unsubscribe1 = onSnapshot(q1, (snapshot) => {
    snapshot.forEach((doc) => {
      const data = doc.data();
      slotsMap.set(doc.id, {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toMillis() || Date.now(),
        updatedAt: data.updatedAt?.toMillis() || Date.now(),
        checkedInAt: data.checkedInAt?.toMillis(),
        confirmedAt: data.confirmedAt?.toMillis(),
      } as TimeSlot);
    });
    
    // Remove deleted docs
    const currentIds = new Set(snapshot.docs.map(doc => doc.id));
    for (const [id, slot] of slotsMap.entries()) {
      if (slot.participantIds.includes(userId) && !currentIds.has(id)) {
        // Only remove if this was the participant query's slot
        const isVerifier = slot.verifierId === userId;
        if (!isVerifier) {
          slotsMap.delete(id);
        }
      }
    }
    
    updateCallback();
  });

  // Subscribe to slots where user is verifier
  const unsubscribe2 = onSnapshot(q2, (snapshot) => {
    snapshot.forEach((doc) => {
      const data = doc.data();
      slotsMap.set(doc.id, {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toMillis() || Date.now(),
        updatedAt: data.updatedAt?.toMillis() || Date.now(),
        checkedInAt: data.checkedInAt?.toMillis(),
        confirmedAt: data.confirmedAt?.toMillis(),
      } as TimeSlot);
    });
    
    // Remove deleted docs
    const currentIds = new Set(snapshot.docs.map(doc => doc.id));
    for (const [id, slot] of slotsMap.entries()) {
      if (slot.verifierId === userId && !currentIds.has(id)) {
        // Only remove if this was the verifier query's slot
        const isParticipant = slot.participantIds.includes(userId);
        if (!isParticipant) {
          slotsMap.delete(id);
        }
      }
    }
    
    updateCallback();
  });

  return () => {
    unsubscribe1();
    unsubscribe2();
  };
};
