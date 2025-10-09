import { useState } from "react";
import { useStore } from "../store";
import { addWorkspaceMember, updateMemberRole } from "../services/workspaceService";
import type { UserRole } from "../types";

interface AddMemberPanelProps {
  onClose: () => void;
}

export default function AddMemberPanel({ onClose }: AddMemberPanelProps) {
  const { user, users, currentWorkspace, workspaceMembers } = useStore();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("participant");
  const [inviting, setInviting] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  // Get current workspace members
  const currentMembers = workspaceMembers.filter(
    (m) => m.workspaceId === currentWorkspace?.id
  );
  const memberUserIds = new Set(currentMembers.map((m) => m.userId));
  const currentWorkspaceUsers = users.filter((u) => memberUserIds.has(u.id));

  const handleSearchUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    setSearchResults(null);

    try {
      const email = inviteEmail.trim().toLowerCase();
      
      // Check if user exists in the system
      const existingUser = users.find(u => u.email.toLowerCase() === email);
      
      if (existingUser) {
        const isMember = workspaceMembers.some(
          m => m.userId === existingUser.id && m.workspaceId === currentWorkspace?.id
        );
        
        if (isMember) {
          alert("⚠️ This user is already a member of this workspace!");
        } else {
          setSearchResults(existingUser);
        }
      } else {
        alert(`❌ User not found.\n\nThey need to:\n1. Sign up at CheckSync\n2. Use email: ${email}`);
      }
    } catch (error) {
      console.error("Error searching user:", error);
      alert("Failed to search user. Please try again.");
    } finally {
      setInviting(false);
    }
  };

  const handleAddMember = async () => {
    if (!currentWorkspace || !searchResults) return;

    setInviting(true);
    try {
      await addWorkspaceMember(currentWorkspace.id, searchResults.id, inviteRole);
      alert(`✅ ${searchResults.name} has been added as ${inviteRole}!`);
      setInviteEmail("");
      setSearchResults(null);
      setInviteRole("participant");
      // Refresh page to show new member
      window.location.reload();
    } catch (error) {
      console.error("Error adding member:", error);
      alert("Failed to add member. Please try again.");
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!user || !currentWorkspace) return;

    setUpdating(userId);
    try {
      await updateMemberRole(currentWorkspace.id, userId, newRole);
      alert(`✅ Role updated successfully!`);
      window.location.reload();
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Failed to update role. Please try again.");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Manage Workspace Team
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {currentWorkspace?.name} · {currentWorkspaceUsers.length} members
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
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
        </div>

        <div className="p-6 space-y-6">
          {/* Add Member Section - Prominent */}
          <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-6 border-2 border-primary/20">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">➕</span>
              Add Team Member
            </h3>
            
            <form onSubmit={handleSearchUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search by Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="teammate@example.com"
                  className="input-field text-base"
                  required
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 User must have a CheckSync account with this email
                </p>
              </div>

              {!searchResults ? (
                <button
                  type="submit"
                  disabled={inviting}
                  className="btn-primary w-full text-base py-3"
                >
                  {inviting ? "Searching..." : "🔍 Search User"}
                </button>
              ) : (
                <div className="bg-white rounded-lg p-4 border-2 border-green-200 animate-in fade-in">
                  <p className="text-sm font-medium text-green-700 mb-3">✅ User Found!</p>
                  
                  <div className="flex items-center gap-3 mb-4">
                    {searchResults.photoURL ? (
                      <img
                        src={searchResults.photoURL}
                        alt={searchResults.name}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {searchResults.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900 text-base">
                        {searchResults.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {searchResults.email}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign Role
                    </label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as UserRole)}
                      className="input-field text-base"
                    >
                      <option value="participant">👤 Participant - Can check in</option>
                      <option value="verifier">🔒 Verifier - Can verify attendance</option>
                      <option value="manager">📊 Manager - Can create & manage slots</option>
                      <option value="admin">👑 Admin - Full workspace access</option>
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddMember}
                      disabled={inviting}
                      className="btn-primary flex-1 text-base py-3"
                    >
                      {inviting ? "Adding..." : "✅ Add to Workspace"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchResults(null);
                        setInviteEmail("");
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Current Members Section */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center justify-between">
              <span>Current Members</span>
              <span className="text-sm font-normal text-gray-500">
                {currentWorkspaceUsers.length} total
              </span>
            </h3>
            
            {currentWorkspaceUsers.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <div className="text-6xl mb-4">👥</div>
                <p className="text-gray-500 font-medium">No team members yet</p>
                <p className="text-sm text-gray-400 mt-2">
                  Use the form above to add your first team member!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentWorkspaceUsers.map((teamUser) => {
                  const memberData = currentMembers.find((m) => m.userId === teamUser.id);
                  const isCurrentUser = teamUser.id === user?.id;
                  
                  return (
                    <div
                      key={teamUser.id}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                        isCurrentUser
                          ? "border-primary/50 bg-primary/5"
                          : "border-gray-200 hover:border-primary/30 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {teamUser.photoURL ? (
                          <img
                            src={teamUser.photoURL}
                            alt={teamUser.name}
                            className="w-12 h-12 rounded-full"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {teamUser.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {teamUser.name}
                            {isCurrentUser && (
                              <span className="text-sm font-normal text-primary ml-2">
                                (You)
                              </span>
                            )}
                          </h4>
                          <p className="text-sm text-gray-600">{teamUser.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {isCurrentUser ? (
                          <div className="px-4 py-2 bg-primary/10 text-primary rounded-lg font-medium text-sm capitalize">
                            {memberData?.role || "admin"}
                          </div>
                        ) : (
                          <>
                            <select
                              value={memberData?.role || "participant"}
                              onChange={(e) =>
                                handleRoleChange(teamUser.id, e.target.value as UserRole)
                              }
                              disabled={updating === teamUser.id}
                              className="input-field py-2 px-3 text-sm"
                            >
                              <option value="participant">👤 Participant</option>
                              <option value="verifier">🔒 Verifier</option>
                              <option value="manager">📊 Manager</option>
                              <option value="admin">👑 Admin</option>
                            </select>
                            {updating === teamUser.id && (
                              <span className="text-sm text-gray-500">Updating...</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

