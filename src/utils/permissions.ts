import type { TimeSlot, User, UserRole, WorkspaceMember, Workspace } from "../types";

// Role hierarchy and permissions

export const ROLE_HIERARCHY = {
  admin: 4,
  manager: 3,
  verifier: 2,
  participant: 1,
};

export const ROLE_DESCRIPTIONS = {
  participant: "Can check in to time slots they're assigned to",
  verifier: "Can verify attendance + check in",
  manager: "Can create/edit slots, verify attendance, and check in",
  admin: "Workspace owner - Full access to this workspace",
};

// Get user's role in current workspace
export const getUserWorkspaceRole = (
  userId: string,
  workspaceId: string | undefined,
  workspaceMembers: WorkspaceMember[]
): UserRole => {
  if (!workspaceId) return "participant";
  const member = workspaceMembers.find(
    (m) => m.userId === userId && m.workspaceId === workspaceId
  );
  return member?.role || "participant";
};

// Check if user is workspace owner
export const isWorkspaceOwner = (
  user: User | null,
  workspace: Workspace | null
): boolean => {
  if (!user || !workspace) return false;
  return workspace.ownerId === user.id;
};

// Permission checks (workspace-aware)
export const canCreateSlot = (
  user: User | null,
  workspaceRole?: UserRole
): boolean => {
  if (!user) return false;
  const role = workspaceRole || user.role;
  return ["manager", "admin"].includes(role);
};

export const canEditSlot = (
  user: User | null,
  slot: TimeSlot,
  workspaceRole?: UserRole
): boolean => {
  if (!user) return false;
  const role = workspaceRole || user.role;
  if (role === "admin") return true;
  if (role === "manager") return true;
  // Creators can edit their own slots
  return slot.createdBy === user.id;
};

export const canDeleteSlot = (
  user: User | null,
  slot: TimeSlot,
  workspaceRole?: UserRole
): boolean => {
  if (!user) return false;
  const role = workspaceRole || user.role;
  if (role === "admin") return true;
  if (role === "manager") return true;
  // Only creator can delete (unless admin/manager)
  return slot.createdBy === user.id;
};

export const canCheckIn = (user: User | null, slot: TimeSlot): boolean => {
  if (!user) return false;
  // Must be a participant in the slot
  return slot.participantIds.includes(user.id);
};

export const canVerify = (
  user: User | null,
  slot: TimeSlot,
  workspaceRole?: UserRole
): boolean => {
  if (!user) return false;
  const role = workspaceRole || user.role;
  if (role === "admin") return true; // Workspace admins can verify anything
  // Must be the assigned verifier
  return slot.verifierId === user.id;
};

export const canManageUsers = (
  user: User | null,
  workspace: Workspace | null
): boolean => {
  if (!user || !workspace) return false;
  // Only workspace owner can manage roles
  return workspace.ownerId === user.id;
};

export const canViewSlot = (user: User | null, slot: TimeSlot): boolean => {
  if (!user) return false;
  if (user.role === "admin" || user.role === "manager") return true;
  // Can view if participant or verifier
  return slot.participantIds.includes(user.id) || slot.verifierId === user.id;
};

export const canExportData = (
  user: User | null,
  workspaceRole?: UserRole
): boolean => {
  if (!user) return false;
  const role = workspaceRole || user.role;
  // Manager and Admin can export
  return ["manager", "admin"].includes(role);
};

export const canManageConnections = (user: User | null): boolean => {
  if (!user) return false;
  // Everyone can manage their own connections, but admins see all users
  return true;
};

export const getRoleColor = (role: UserRole): string => {
  switch (role) {
    case "admin":
      return "bg-purple-100 text-purple-700 border-purple-300";
    case "manager":
      return "bg-blue-100 text-blue-700 border-blue-300";
    case "verifier":
      return "bg-green-100 text-green-700 border-green-300";
    case "participant":
      return "bg-gray-100 text-gray-700 border-gray-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
};

export const getRoleIcon = (role: UserRole): string => {
  switch (role) {
    case "admin":
      return "👑";
    case "manager":
      return "📊";
    case "verifier":
      return "🔒";
    case "participant":
      return "👤";
    default:
      return "👤";
  }
};
