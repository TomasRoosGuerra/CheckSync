export type UserRole = "participant" | "verifier" | "manager" | "admin";

export type SlotStatus =
  | "planned"
  | "checked-in"
  | "confirmed"
  | "missed"
  | "sick"
  | "away";

export interface User {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
  role: UserRole;
  timeZone: string;
  currentWorkspaceId?: string; // Active workspace
}

export type WorkspaceColor =
  | "blue"
  | "purple"
  | "orange"
  | "green"
  | "red"
  | "yellow"
  | "pink"
  | "teal";

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string; // Creator/Admin of this workspace
  isPublic: boolean; // Public workspaces are discoverable
  color?: WorkspaceColor; // Visual identifier for multi-workspace views
  createdAt: number;
  updatedAt: number;
  timezone?: string; // Default timezone for the workspace
  settings?: {
    allowSelfCheckIn?: boolean;
    requireVerification?: boolean;
    autoConfirmAfterHours?: number; // Auto-confirm after X hours if not verified
  };
  deletedAt?: number; // Timestamp when workspace was deleted
  deletedBy?: string; // User ID who deleted the workspace
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
  type:
    | "join_request"
    | "request_approved"
    | "request_rejected"
    | "workspace_invite"
    | "missed_checkin";
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

export interface DeletedWorkspaceView {
  workspaceId: string;
  userId: string;
  deletedAt: number;
  viewsRemaining: number; // Number of times user will see this deleted workspace
}

export interface TimeSlot {
  id: string;
  workspaceId: string; // Belongs to a workspace
  title: string;
  subtitle?: string;
  date: string; // ISO date string
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  participantIds: string[];
  verifierId: string;
  status: SlotStatus;
  notes?: string;
  checkedInAt?: number; // timestamp
  confirmedAt?: number; // timestamp
  sickAwayReason?: string; // Reason for sick/away status
  sickAwayDuration?: string; // Duration of sick/away status
  sickAwayAt?: number; // timestamp when marked as sick/away
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  recurringGroupId?: string; // ID linking recurring slots together
  isRecurring?: boolean; // Flag for recurring slots
  labelId?: string; // Optional label for categorization
  labelProperties?: Record<string, string | number>; // Values for label properties
  timezone?: string; // IANA timezone (e.g., "America/New_York")
  allDay?: boolean; // For all-day events
  missedNotifiedAt?: number; // timestamp when missed check-in notification was sent
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

export interface TimeConflict {
  id: string;
  slot1Id: string;
  slot2Id: string;
  workspace1Id: string;
  workspace2Id: string;
  date: string;
  overlapStart: string;
  overlapEnd: string;
  overlapMinutes: number;
}

export interface Label {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
  createdBy: string;
  createdAt: number;
  properties?: LabelProperty[];
}

export interface LabelProperty {
  id: string;
  type: "text" | "number" | "range";
  name: string;
  required?: boolean;
  defaultValue?: string | number;
  options?: {
    min?: number;
    max?: number;
    step?: number;
    placeholder?: string;
  };
}
