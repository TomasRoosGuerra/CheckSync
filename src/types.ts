export type UserRole = "participant" | "verifier" | "manager" | "admin";

export type SlotStatus = "planned" | "checked-in" | "confirmed" | "missed";

export interface User {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
  role: UserRole;
  timeZone: string;
  currentWorkspaceId?: string; // Active workspace
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string; // Creator/Admin of this workspace
  isPublic: boolean; // Public workspaces are discoverable
  createdAt: number;
  updatedAt: number;
}

export interface JoinRequest {
  id: string;
  workspaceId: string;
  userId: string;
  status: "pending" | "approved" | "rejected";
  message?: string;
  createdAt: number;
  resolvedAt?: number;
  resolvedBy?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: "join_request" | "request_approved" | "request_rejected" | "workspace_invite";
  title: string;
  message: string;
  workspaceId?: string;
  requestId?: string;
  read: boolean;
  createdAt: number;
}

export interface WorkspaceMember {
  workspaceId: string;
  userId: string;
  role: UserRole; // Role within this workspace
  joinedAt: number;
}

export interface TimeSlot {
  id: string;
  workspaceId: string; // Belongs to a workspace
  title: string;
  date: string; // ISO date string
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  participantIds: string[];
  verifierId: string;
  status: SlotStatus;
  notes?: string;
  checkedInAt?: number; // timestamp
  confirmedAt?: number; // timestamp
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  recurringGroupId?: string; // ID linking recurring slots together
  isRecurring?: boolean; // Flag for recurring slots
}

export interface AttendanceRecord {
  slotId: string;
  participantId: string;
  verifierId: string;
  checkInTime?: number;
  confirmationTime?: number;
  status: SlotStatus;
}

export interface ExportFilter {
  startDate: string;
  endDate: string;
  participantIds?: string[];
  confirmedOnly?: boolean;
}
