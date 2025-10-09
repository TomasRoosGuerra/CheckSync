import { useEffect, useState } from "react";
import {
  approveJoinRequest,
  createNotification,
  getPendingRequests,
  rejectJoinRequest,
} from "../services/requestService";
import {
  addWorkspaceMember,
  updateMemberRole,
} from "../services/workspaceService";
import { useStore } from "../store";
import type { JoinRequest, UserRole } from "../types";
import { getUserWorkspaceRole, isWorkspaceOwner } from "../utils/permissions";

interface TeamPanelProps {
  onClose: () => void;
}

export default function TeamPanel({ onClose }: TeamPanelProps) {
  const {
    user,
    users,
    currentWorkspace,
    workspaceMembers,
  } = useStore();
  const [activeTab, setActiveTab] = useState<"members" | "add" | "requests">(
    "members"
  );
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>("participant");
  const [processing, setProcessing] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [pendingRequests, setPendingRequests] = useState<JoinRequest[]>([]);
  const [memberSearch, setMemberSearch] = useState("");

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

  // Load pending requests
  useEffect(() => {
    if (currentWorkspace && isOwner) {
      loadPendingRequests();
    }
  }, [currentWorkspace, isOwner]);

  const loadPendingRequests = async () => {
    if (!currentWorkspace) return;
    const requests = await getPendingRequests(currentWorkspace.id);
    setPendingRequests(requests);
  };

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
      window.location.reload();
    } catch (error) {
      alert("Failed to add member.");
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
      window.location.reload();
    } catch (error) {
      alert("Failed to update role.");
    } finally {
      setUpdating(null);
    }
  };

  const handleApproveRequest = async (request: JoinRequest) => {
    if (!currentWorkspace || !user) return;

    setProcessing(true);
    try {
      await approveJoinRequest(request.id, user.id);
      await addWorkspaceMember(
        currentWorkspace.id,
        request.userId,
        "participant"
      );
      await createNotification(
        request.userId,
        "request_approved",
        "Request Approved! 🎉",
        `Welcome to ${currentWorkspace.name}!`,
        currentWorkspace.id
      );
      alert("✅ Request approved!");
      loadPendingRequests();
    } catch (error) {
      alert("Failed to approve request.");
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectRequest = async (request: JoinRequest) => {
    if (!user) return;

    setProcessing(true);
    try {
      await rejectJoinRequest(request.id, user.id);
      alert("Request rejected.");
      loadPendingRequests();
    } catch (error) {
      alert("Failed to reject request.");
    } finally {
      setProcessing(false);
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
                <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
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
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              👥 Members ({currentWorkspaceUsers.length})
            </button>
            {isOwner && (
              <>
                <button
                  onClick={() => setActiveTab("add")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    activeTab === "add"
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  ➕ Add Member
                </button>
                {pendingRequests.length > 0 && (
                  <button
                    onClick={() => setActiveTab("requests")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap relative ${
                      activeTab === "requests"
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    🙋 Requests ({pendingRequests.length})
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {pendingRequests.length}
                    </span>
                  </button>
                )}
              </>
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

                          <div className="w-full sm:w-auto flex-shrink-0">
                            {isOwner && !isCurrentUser ? (
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

          {/* Add Member Tab */}
          {activeTab === "add" && isOwner && (
            <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-6 border-2 border-primary/20">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Search User by Email
              </h3>

              <form onSubmit={handleSearchUser} className="space-y-4">
                <input
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="teammate@example.com"
                  className="input-field"
                  required
                />

                {!searchResult ? (
                  <button
                    type="submit"
                    disabled={processing}
                    className="btn-primary w-full"
                  >
                    {processing ? "Searching..." : "🔍 Search User"}
                  </button>
                ) : (
                  <div className="bg-white rounded-lg p-4 border-2 border-green-200">
                    <p className="text-sm font-medium text-green-700 mb-3">
                      ✅ User Found!
                    </p>
                    <div className="flex items-center gap-3 mb-4">
                      {searchResult.photoURL ? (
                        <img
                          src={searchResult.photoURL}
                          alt={searchResult.name}
                          className="w-12 h-12 rounded-full"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                          <span className="text-white font-bold">
                            {searchResult.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">
                          {searchResult.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {searchResult.email}
                        </p>
                      </div>
                    </div>

                    <select
                      value={selectedRole}
                      onChange={(e) =>
                        setSelectedRole(e.target.value as UserRole)
                      }
                      className="input-field mb-4"
                    >
                      <option value="participant">👤 Participant</option>
                      <option value="verifier">🔒 Verifier</option>
                      <option value="manager">📊 Manager</option>
                      <option value="admin">👑 Admin</option>
                    </select>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleAddMember}
                        disabled={processing}
                        className="btn-primary flex-1"
                      >
                        {processing ? "Adding..." : "✅ Add to Workspace"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchResult(null);
                          setSearchEmail("");
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
          )}

          {/* Requests Tab */}
          {activeTab === "requests" && isOwner && (
            <div className="space-y-3">
              {pendingRequests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">✅</div>
                  <p className="text-gray-500">No pending requests</p>
                </div>
              ) : (
                pendingRequests.map((request) => {
                  const requestUser = users.find(
                    (u) => u.id === request.userId
                  );
                  return (
                    <div
                      key={request.id}
                      className="p-4 rounded-lg border-2 border-yellow-200 bg-yellow-50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {requestUser?.name || "Unknown User"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {requestUser?.email}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {request.message}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveRequest(request)}
                            disabled={processing}
                            className="btn-primary text-sm py-2 px-4"
                          >
                            ✅ Approve
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request)}
                            disabled={processing}
                            className="btn-secondary text-sm py-2 px-4"
                          >
                            ❌ Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
