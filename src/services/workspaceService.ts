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
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import type { User, Workspace, WorkspaceMember } from "../types";

const WORKSPACES_COLLECTION = "workspaces";
const WORKSPACE_MEMBERS_COLLECTION = "workspaceMembers";

// ===== WORKSPACE SERVICES =====

export const createWorkspace = async (
  ownerId: string,
  name: string,
  description?: string,
  isPublic: boolean = false
): Promise<string> => {
  try {
    const workspaceRef = doc(collection(db, WORKSPACES_COLLECTION));
    const workspace = {
      name,
      description,
      ownerId,
      isPublic,
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

export const getUserWorkspaces = async (
  userId: string
): Promise<Workspace[]> => {
  try {
    // Get workspaces where user is a member
    const q = query(
      collection(db, WORKSPACE_MEMBERS_COLLECTION),
      where("userId", "==", userId)
    );
    const memberSnapshot = await getDocs(q);

    const workspaceIds = memberSnapshot.docs.map(
      (doc) => doc.data().workspaceId
    );

    // Fetch workspace details
    const workspaces: Workspace[] = [];
    for (const workspaceId of workspaceIds) {
      const workspaceDoc = await getDoc(
        doc(db, WORKSPACES_COLLECTION, workspaceId)
      );
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

    return snapshot.docs.map(
      (doc) =>
        ({
          ...doc.data(),
          joinedAt: doc.data().joinedAt?.toMillis() || Date.now(),
        } as WorkspaceMember)
    );
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

export const removeWorkspaceMember = async (
  workspaceId: string,
  userId: string
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
      await deleteDoc(memberDoc.ref);
      console.log("✅ Member removed from workspace");
    }
  } catch (error) {
    console.error("Error removing workspace member:", error);
    throw error;
  }
};

export const bulkAddWorkspaceMembers = async (
  workspaceId: string,
  members: { userId: string; role: string }[]
) => {
  try {
    const batch = [];
    for (const member of members) {
      const memberRef = doc(collection(db, WORKSPACE_MEMBERS_COLLECTION));
      batch.push(
        setDoc(memberRef, {
          workspaceId,
          userId: member.userId,
          role: member.role,
          joinedAt: serverTimestamp(),
        })
      );
    }

    await Promise.all(batch);
    console.log(`✅ ${members.length} members added to workspace`);
  } catch (error) {
    console.error("Error bulk adding workspace members:", error);
    throw error;
  }
};

export const createWorkspaceFromTemplate = async (
  ownerId: string,
  name: string,
  template: "tennis-club" | "gym" | "office" | "school" | "custom",
  description?: string
): Promise<string> => {
  try {
    // Create the workspace first
    const workspaceId = await createWorkspace(
      ownerId,
      name,
      description,
      false
    );

    // Add template-specific time slots if needed
    if (template !== "custom") {
      // This would create initial time slots based on the template
      // For now, we'll just return the workspace ID
      console.log(`✅ Workspace created from ${template} template`);
    }

    return workspaceId;
  } catch (error) {
    console.error("Error creating workspace from template:", error);
    throw error;
  }
};

// Get all users that the current user has collaborated with across all workspaces
export const getCollaboratedUsers = async (userId: string): Promise<User[]> => {
  try {
    // Get all workspaces where user is a member
    const memberQuery = query(
      collection(db, WORKSPACE_MEMBERS_COLLECTION),
      where("userId", "==", userId)
    );
    const memberSnapshot = await getDocs(memberQuery);

    const workspaceIds = memberSnapshot.docs.map(
      (doc) => doc.data().workspaceId
    );

    if (workspaceIds.length === 0) return [];

    // Get all members from these workspaces
    const allMembersQuery = query(
      collection(db, WORKSPACE_MEMBERS_COLLECTION),
      where("workspaceId", "in", workspaceIds)
    );
    const allMembersSnapshot = await getDocs(allMembersQuery);

    // Get unique user IDs (excluding current user)
    const collaboratedUserIds = new Set(
      allMembersSnapshot.docs
        .map((doc) => doc.data().userId)
        .filter((id) => id !== userId)
    );

    // Fetch user profiles for collaborated users
    const userProfiles: User[] = [];
    for (const uid of collaboratedUserIds) {
      try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
          userProfiles.push({
            id: userDoc.id,
            ...userDoc.data(),
          } as User);
        }
      } catch (error) {
        console.warn(`Failed to fetch user profile for ${uid}:`, error);
      }
    }

    return userProfiles;
  } catch (error) {
    console.error("Error getting collaborated users:", error);
    return [];
  }
};

// Search users globally by email (across all users in the system)
export const searchUsersGlobally = async (email: string): Promise<User[]> => {
  try {
    // First try exact match
    const exactQuery = query(
      collection(db, "users"),
      where("email", "==", email.toLowerCase())
    );
    const exactSnapshot = await getDocs(exactQuery);
    
    if (!exactSnapshot.empty) {
      return exactSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
    }
    
    // If no exact match, try prefix search for partial matches
    const prefixQuery = query(
      collection(db, "users"),
      where("email", ">=", email.toLowerCase()),
      where("email", "<=", email.toLowerCase() + "\uf8ff")
    );
    const prefixSnapshot = await getDocs(prefixQuery);

    return prefixSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as User[];
  } catch (error) {
    console.error("Error searching users globally:", error);
    return [];
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
    const members = snapshot.docs.map(
      (doc) =>
        ({
          ...doc.data(),
          joinedAt: doc.data().joinedAt?.toMillis() || Date.now(),
        } as WorkspaceMember)
    );

    callback(members);
  });
};
