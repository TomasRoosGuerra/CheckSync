import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Workspace, WorkspaceMember } from "../types";

const WORKSPACES_COLLECTION = "workspaces";
const WORKSPACE_MEMBERS_COLLECTION = "workspaceMembers";

// ===== WORKSPACE SERVICES =====

export const createWorkspace = async (
  ownerId: string,
  name: string,
  description?: string
): Promise<string> => {
  try {
    const workspaceRef = doc(collection(db, WORKSPACES_COLLECTION));
    const workspace = {
      name,
      description,
      ownerId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    await setDoc(workspaceRef, workspace);
    
    // Add owner as admin member
    const memberRef = doc(collection(db, WORKSPACE_MEMBERS_COLLECTION));
    await setDoc(memberRef, {
      workspaceId: workspaceRef.id,
      userId: ownerId,
      role: "admin",
      joinedAt: serverTimestamp(),
    });
    
    console.log("✅ Workspace created:", workspaceRef.id);
    return workspaceRef.id;
  } catch (error) {
    console.error("❌ Error creating workspace:", error);
    throw error;
  }
};

export const getUserWorkspaces = async (userId: string): Promise<Workspace[]> => {
  try {
    // Get workspaces where user is a member
    const q = query(
      collection(db, WORKSPACE_MEMBERS_COLLECTION),
      where("userId", "==", userId)
    );
    const memberSnapshot = await getDocs(q);
    
    const workspaceIds = memberSnapshot.docs.map((doc) => doc.data().workspaceId);
    
    // Fetch workspace details
    const workspaces: Workspace[] = [];
    for (const workspaceId of workspaceIds) {
      const workspaceDoc = await getDoc(doc(db, WORKSPACES_COLLECTION, workspaceId));
      if (workspaceDoc.exists()) {
        workspaces.push({
          id: workspaceDoc.id,
          ...workspaceDoc.data(),
          createdAt: workspaceDoc.data().createdAt?.toMillis() || Date.now(),
          updatedAt: workspaceDoc.data().updatedAt?.toMillis() || Date.now(),
        } as Workspace);
      }
    }
    
    return workspaces;
  } catch (error) {
    console.error("Error getting workspaces:", error);
    return [];
  }
};

export const getWorkspaceMembers = async (
  workspaceId: string
): Promise<WorkspaceMember[]> => {
  try {
    const q = query(
      collection(db, WORKSPACE_MEMBERS_COLLECTION),
      where("workspaceId", "==", workspaceId)
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      joinedAt: doc.data().joinedAt?.toMillis() || Date.now(),
    } as WorkspaceMember));
  } catch (error) {
    console.error("Error getting workspace members:", error);
    return [];
  }
};

export const addWorkspaceMember = async (
  workspaceId: string,
  userId: string,
  role: string
) => {
  try {
    const memberRef = doc(collection(db, WORKSPACE_MEMBERS_COLLECTION));
    await setDoc(memberRef, {
      workspaceId,
      userId,
      role,
      joinedAt: serverTimestamp(),
    });
    console.log("✅ Member added to workspace");
  } catch (error) {
    console.error("Error adding workspace member:", error);
    throw error;
  }
};

export const updateMemberRole = async (
  workspaceId: string,
  userId: string,
  role: string
) => {
  try {
    const q = query(
      collection(db, WORKSPACE_MEMBERS_COLLECTION),
      where("workspaceId", "==", workspaceId),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const memberDoc = snapshot.docs[0];
      await setDoc(memberDoc.ref, { role }, { merge: true });
      console.log("✅ Member role updated");
    }
  } catch (error) {
    console.error("Error updating member role:", error);
    throw error;
  }
};

export const subscribeToWorkspaceMembers = (
  workspaceId: string,
  callback: (members: WorkspaceMember[]) => void
) => {
  const q = query(
    collection(db, WORKSPACE_MEMBERS_COLLECTION),
    where("workspaceId", "==", workspaceId)
  );
  
  return onSnapshot(q, (snapshot) => {
    const members = snapshot.docs.map((doc) => ({
      ...doc.data(),
      joinedAt: doc.data().joinedAt?.toMillis() || Date.now(),
    } as WorkspaceMember));
    
    callback(members);
  });
};

