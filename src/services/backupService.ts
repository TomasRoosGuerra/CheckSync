import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import type { TimeSlot, Workspace, WorkspaceMember } from "../types";

export interface WorkspaceBackup {
  workspace: Workspace;
  members: WorkspaceMember[];
  timeSlots: TimeSlot[];
  exportedAt: number;
  exportedBy: string;
}

export const exportWorkspaceData = async (
  workspaceId: string,
  userId: string
): Promise<WorkspaceBackup> => {
  try {
    // Get workspace data
    const workspaceQuery = query(
      collection(db, "workspaces"),
      where("__name__", "==", workspaceId)
    );
    const workspaceSnapshot = await getDocs(workspaceQuery);

    if (workspaceSnapshot.empty) {
      throw new Error("Workspace not found");
    }

    const workspace = {
      id: workspaceId,
      ...workspaceSnapshot.docs[0].data(),
    } as Workspace;

    // Get workspace members
    const membersQuery = query(
      collection(db, "workspaceMembers"),
      where("workspaceId", "==", workspaceId)
    );
    const membersSnapshot = await getDocs(membersQuery);
    const members = membersSnapshot.docs.map((doc) => ({
      ...doc.data(),
      joinedAt: doc.data().joinedAt?.toMillis() || Date.now(),
    })) as WorkspaceMember[];

    // Get time slots
    const slotsQuery = query(
      collection(db, "timeSlots"),
      where("workspaceId", "==", workspaceId)
    );
    const slotsSnapshot = await getDocs(slotsQuery);
    const timeSlots = slotsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date,
      createdAt: doc.data().createdAt?.toMillis() || Date.now(),
      updatedAt: doc.data().updatedAt?.toMillis() || Date.now(),
    })) as TimeSlot[];

    const backup: WorkspaceBackup = {
      workspace,
      members,
      timeSlots,
      exportedAt: Date.now(),
      exportedBy: userId,
    };

    return backup;
  } catch (error) {
    console.error("Error exporting workspace data:", error);
    throw error;
  }
};

export const downloadBackup = (backup: WorkspaceBackup, filename?: string) => {
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    filename ||
    `workspace-backup-${backup.workspace.name}-${
      new Date().toISOString().split("T")[0]
    }.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const validateBackup = (backup: any): backup is WorkspaceBackup => {
  return (
    backup &&
    typeof backup === "object" &&
    backup.workspace &&
    Array.isArray(backup.members) &&
    Array.isArray(backup.timeSlots) &&
    typeof backup.exportedAt === "number" &&
    typeof backup.exportedBy === "string"
  );
};
