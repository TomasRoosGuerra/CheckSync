/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from "react";
import {
  addWorkspaceMember,
  removeWorkspaceMember,
  updateMemberRole,
} from "../services/workspaceService";
import { useStore } from "../store";
import type { User, UserRole } from "../types";
import {
  canLeaveWorkspace,
  getUserWorkspaceRole,
  isWorkspaceOwner,
} from "../utils/permissions";
import EnhancedMemberAdder from "./EnhancedMemberAdder";

interface TeamPanelProps {
  onClose: () => void;
}

export default function TeamPanel({ onClose }: TeamPanelProps) {
  const { user, users, currentWorkspace, workspaceMembers } = useStore();
  const [activeTab, setActiveTab] = useState<"members" | "add">("members");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState<User | null>(null);
  const [selectedRole] = useState<UserRole>("participant");
  const [, setProcessing] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [showEnhancedAdder, setShowEnhancedAdder] = useState(false);

  // Get current workspace data
  const currentMembers = workspaceMembers.filter(
    (m) => m.workspaceId === currentWorkspace?.id
  );
  const memberUserIds = new Set(currentMembers.map((m) => m.userId));
  const currentWorkspaceUsers = users.filter((u) => memberUserIds.has(u.id));

  const userRole =
    user && currentWorkspace
      ? getUserWorkspaceRole(user.id, currentWorkspace.id, workspaceMembers)
      : "participant";

  const isOwner = isWorkspaceOwner(user, currentWorkspace);
  const canManage = isOwner || userRole === "manager" || userRole === "admin";

  // @ts-expect-error - Function is used in UI but not detected by TypeScript
  const handleSearchUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;

    setProcessing(true);
    setSearchResult(null);

    try {
      const email = searchEmail.trim().toLowerCase();
      const existingUser = users.find((u) => u.email.toLowerCase() === email);

      if (existingUser) {
        const isMember = memberUserIds.has(existingUser.id);
        if (isMember) {
          alert("⚠️ This user is already a member!");
        } else {
          setSearchResult(existingUser);
        }
      } else {
        alert(`❌ User not found.\n\nAsk them to sign up with: ${email}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to search user.");
    } finally {
      setProcessing(false);
    }
  };

  // @ts-expect-error - Function is used in UI but not detected by TypeScript
  const handleAddMember = async () => {
    if (!currentWorkspace || !searchResult) return;

    setProcessing(true);
    try {
      await addWorkspaceMember(
        currentWorkspace.id,
        searchResult.id,
        selectedRole
      );
      alert(`✅ ${searchResult.name} added as ${selectedRole}!`);
      setSearchEmail("");
      setSearchResult(null);
      setActiveTab("members");
      // State will update via subscription in App.tsx
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message.includes("already a member")
      ) {
        alert("⚠️ This user is already a member of this workspace.");
      } else {
        alert("Failed to add member.");
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!currentWorkspace) return;

    setUpdating(userId);
    try {
      await updateMemberRole(currentWorkspace.id, userId, newRole);
      alert("✅ Role updated!");
      // State will update via subscription in App.tsx
    } catch (error) {
      alert("Failed to update role.");
    } finally {
      setUpdating(null);
    }
  };

  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!currentWorkspace) return;

    const confirmRemove = confirm(
      `Are you sure you want to remove "${memberName}" from "${currentWorkspace.name}"?\n\nThis action cannot be undone. They will need to be re-invited to rejoin.`
    );

    if (!confirmRemove) return;

    setUpdating(userId);
    try {
      await removeWorkspaceMember(currentWorkspace.id, userId);
      alert(`✅ ${memberName} has been removed from the workspace.`);
      // State will update via subscription in App.tsx
    } catch (error) {
      console.error("Error removing member:", error);
      alert("Failed to remove member. Please try again.");
    } finally {
      setUpdating(null);
    }
  };

  const handleLeaveWorkspace = async () => {
    console.log("🔍 handleLeaveWorkspace called:", {
      user: user ? { id: user.id, name: user.name } : null,
      currentWorkspace: currentWorkspace
        ? {
            id: currentWorkspace.id,
            name: currentWorkspace.name,
            ownerId: currentWorkspace.ownerId,
          }
        : null,
    });

    if (!currentWorkspace || !user) {
      console.log("❌ Cannot leave: missing workspace or user");
      return;
    }

    const confirmLeave = confirm(
      `Are you sure you want to leave "${currentWorkspace.name}"?\n\nThis action cannot be undone. You'll need to be re-invited to rejoin.`
    );

    if (!confirmLeave) {
      console.log("❌ User cancelled leave operation");
      return;
    }

    console.log("🚪 Starting leave workspace process...");
    try {
      await removeWorkspaceMember(currentWorkspace.id, user.id);
      console.log("✅ Successfully left workspace");
      alert("✅ You have left the workspace.");
      onClose(); // Close the team panel
      // The workspace will be removed from the user's list via subscription
    } catch (error) {
      console.error("❌ Error leaving workspace:", error);
      alert("Failed to leave workspace. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Team Members
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {currentWorkspace?.name} · {currentWorkspaceUsers.length}{" "}
                  members
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-all"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab("members")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === "members"
                  ? "bg-primary"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
              style={{
                color: activeTab === "members" ? "white" : "#374151",
              }}
            >
              👥 Members ({currentWorkspaceUsers.length})
            </button>
            {canManage && (
              <button
                onClick={() => setShowEnhancedAdder(true)}
                className="px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap bg-primary hover:bg-primary-dark"
                style={{ color: "white" }}
              >
                ➕ Add Members
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Members Tab */}
          {activeTab === "members" && (
            <div className="space-y-3">
              {/* Search Members */}
              {currentWorkspaceUsers.length > 3 && (
                <div className="relative">
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search members by name or email..."
                    className="input-field pl-10"
                  />
                  <svg
                    className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
              )}

              {currentWorkspaceUsers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👥</div>
                  <p className="text-gray-500 font-medium mb-2">
                    No team members yet
                  </p>
                  <p className="text-sm text-gray-400">
                    {isOwner
                      ? "Use the 'Add Member' tab to invite your team"
                      : "Contact the workspace owner"}
                  </p>
                </div>
              ) : (
                <>
                  {currentWorkspaceUsers
                    .filter(
                      (m) =>
                        !memberSearch ||
                        m.name
                          .toLowerCase()
                          .includes(memberSearch.toLowerCase()) ||
                        m.email
                          .toLowerCase()
                          .includes(memberSearch.toLowerCase())
                    )
                    .map((member) => {
                      const memberData = currentMembers.find(
                        (m) => m.userId === member.id
                      );
                      const isCurrentUser = member.id === user?.id;

                      return (
                        <div
                          key={member.id}
                          className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                            isCurrentUser
                              ? "border-primary/50 bg-primary/5"
                              : "border-gray-200 hover:border-primary/30"
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {member.photoURL ? (
                              <img
                                src={member.photoURL}
                                alt={member.name}
                                className="w-12 h-12 rounded-full flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-bold text-lg">
                                  {member.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-gray-900 truncate">
                                {member.name}
                                {isCurrentUser && (
                                  <span className="text-sm font-normal text-primary ml-2">
                                    (You)
                                  </span>
                                )}
                                {currentWorkspace?.ownerId === member.id && (
                                  <span className="text-base ml-2">👑</span>
                                )}
                              </h4>
                              <p className="text-sm text-gray-600 truncate">
                                {member.email}
                              </p>
                            </div>
                          </div>

                          <div className="w-full sm:w-auto flex-shrink-0 flex flex-col sm:flex-row gap-2">
                            {canManage && !isCurrentUser ? (
                              <>
                                <select
                                  value={memberData?.role || "participant"}
                                  onChange={(e) =>
                                    handleRoleChange(
                                      member.id,
                                      e.target.value as UserRole
                                    )
                                  }
                                  disabled={updating === member.id}
                                  className="input-field py-2 px-3 text-sm w-full sm:w-auto"
                                >
                                  <option value="participant">
                                    👤 Participant
                                  </option>
                                  <option value="verifier">🔒 Verifier</option>
                                  <option value="manager">📊 Manager</option>
                                  <option value="admin">👑 Admin</option>
                                </select>
                                <button
                                  onClick={() =>
                                    handleRemoveMember(member.id, member.name)
                                  }
                                  disabled={updating === member.id}
                                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {updating === member.id ? "..." : "🗑️ Remove"}
                                </button>
                              </>
                            ) : (
                              <span className="block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm capitalize text-center">
                                {memberData?.role || userRole}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </>
              )}
            </div>
          )}
        </div>

        {/* Leave Workspace Button - Only show for users who can leave */}
        {(() => {
          const canLeave = canLeaveWorkspace(user, currentWorkspace);
          console.log("🔍 TeamPanel render - Leave button visibility:", {
            user: user ? { id: user.id, name: user.name } : null,
            currentWorkspace: currentWorkspace
              ? {
                  id: currentWorkspace.id,
                  name: currentWorkspace.name,
                  ownerId: currentWorkspace.ownerId,
                }
              : null,
            canLeave,
          });
          return canLeave;
        })() && (
          <div className="border-t border-gray-200 p-4 sm:p-6">
            <button
              onClick={handleLeaveWorkspace}
              className="w-full bg-red-50 hover:bg-red-100 text-red-700 font-medium py-3 px-6 rounded-lg transition-colors border border-red-200"
            >
              🚪 Leave Workspace
            </button>
          </div>
        )}

        {/* Debug block removed in production */}
      </div>

      {/* Enhanced Member Adder Modal */}
      {showEnhancedAdder && currentWorkspace && (
        <EnhancedMemberAdder
          workspaceId={currentWorkspace.id}
          onClose={() => setShowEnhancedAdder(false)}
          onMembersAdded={() => {
            // Members will be updated via subscription in App.tsx
            setShowEnhancedAdder(false);
          }}
        />
      )}
    </div>
  );
}
