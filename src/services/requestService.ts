import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import type { JoinRequest, Notification } from "../types";

const REQUESTS_COLLECTION = "joinRequests";
const NOTIFICATIONS_COLLECTION = "notifications";

// ===== JOIN REQUEST SERVICES =====

export const createJoinRequest = async (
  workspaceId: string,
  userId: string,
  message?: string
): Promise<string> => {
  try {
    const requestRef = doc(collection(db, REQUESTS_COLLECTION));
    await setDoc(requestRef, {
      workspaceId,
      userId,
      status: "pending",
      message,
      createdAt: serverTimestamp(),
    });
    
    console.log("✅ Join request created:", requestRef.id);
    return requestRef.id;
  } catch (error) {
    console.error("❌ Error creating join request:", error);
    throw error;
  }
};

export const getPendingRequests = async (
  workspaceId: string
): Promise<JoinRequest[]> => {
  try {
    const q = query(
      collection(db, REQUESTS_COLLECTION),
      where("workspaceId", "==", workspaceId),
      where("status", "==", "pending")
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toMillis() || Date.now(),
      resolvedAt: doc.data().resolvedAt?.toMillis(),
    } as JoinRequest));
  } catch (error) {
    console.error("Error getting pending requests:", error);
    return [];
  }
};

export const getUserRequests = async (userId: string): Promise<JoinRequest[]> => {
  try {
    const q = query(
      collection(db, REQUESTS_COLLECTION),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toMillis() || Date.now(),
      resolvedAt: doc.data().resolvedAt?.toMillis(),
    } as JoinRequest));
  } catch (error) {
    console.error("Error getting user requests:", error);
    return [];
  }
};

export const approveJoinRequest = async (
  requestId: string,
  approvedBy: string
) => {
  try {
    const requestRef = doc(db, REQUESTS_COLLECTION, requestId);
    await updateDoc(requestRef, {
      status: "approved",
      resolvedAt: serverTimestamp(),
      resolvedBy: approvedBy,
    });
    console.log("✅ Join request approved");
  } catch (error) {
    console.error("Error approving request:", error);
    throw error;
  }
};

export const rejectJoinRequest = async (
  requestId: string,
  rejectedBy: string
) => {
  try {
    const requestRef = doc(db, REQUESTS_COLLECTION, requestId);
    await updateDoc(requestRef, {
      status: "rejected",
      resolvedAt: serverTimestamp(),
      resolvedBy: rejectedBy,
    });
    console.log("✅ Join request rejected");
  } catch (error) {
    console.error("Error rejecting request:", error);
    throw error;
  }
};

// ===== NOTIFICATION SERVICES =====

export const createNotification = async (
  userId: string,
  type: Notification["type"],
  title: string,
  message: string,
  workspaceId?: string,
  requestId?: string
): Promise<string> => {
  try {
    const notifRef = doc(collection(db, NOTIFICATIONS_COLLECTION));
    await setDoc(notifRef, {
      userId,
      type,
      title,
      message,
      workspaceId,
      requestId,
      read: false,
      createdAt: serverTimestamp(),
    });
    
    return notifRef.id;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

export const getUserNotifications = async (
  userId: string
): Promise<Notification[]> => {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toMillis() || Date.now(),
    } as Notification));
  } catch (error) {
    console.error("Error getting notifications:", error);
    return [];
  }
};

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const notifRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(notifRef, { read: true });
    console.log("✅ Notification marked as read:", notificationId);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void
) => {
  const q = query(
    collection(db, NOTIFICATIONS_COLLECTION),
    where("userId", "==", userId)
  );
  
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toMillis() || Date.now(),
    } as Notification));
    
    callback(notifications);
  });
};

// ===== PUBLIC WORKSPACE DISCOVERY =====

export const getPublicWorkspaces = async () => {
  try {
    const q = query(
      collection(db, "workspaces"),
      where("isPublic", "==", true)
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toMillis() || Date.now(),
      updatedAt: doc.data().updatedAt?.toMillis() || Date.now(),
    }));
  } catch (error) {
    console.error("Error getting public workspaces:", error);
    return [];
  }
};

