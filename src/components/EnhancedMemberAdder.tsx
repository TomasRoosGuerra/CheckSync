import { useEffect, useState } from "react";
import {
  addWorkspaceMember,
  bulkAddWorkspaceMembers,
  getCollaboratedUsers,
  searchUsersGlobally,
} from "../services/workspaceService";
import { useStore } from "../store";
import type { User, UserRole } from "../types";

interface EnhancedMemberAdderProps {
  workspaceId: string;
  onClose: () => void;
  onMembersAdded: () => void;
}

export default function EnhancedMemberAdder({
  workspaceId,
  onClose,
  onMembersAdded,
}: EnhancedMemberAdderProps) {
  const { user, workspaceMembers } = useStore();
  const [activeTab, setActiveTab] = useState<
    "collaborated" | "search" | "bulk"
  >("collaborated");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [collaboratedUsers, setCollaboratedUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Map<string, UserRole>>(
    new Map()
  );
  const [processing, setProcessing] = useState(false);
  const [searching, setSearching] = useState(false);
  // const [bulkEmails] = useState(""); // TODO: Implement bulk email functionality
  const [bulkRole, setBulkRole] = useState<UserRole>("participant");

  // Get current workspace members to avoid duplicates
  const currentMembers = workspaceMembers.filter(
    (m) => m.workspaceId === workspaceId
  );
  const memberUserIds = new Set(currentMembers.map((m) => m.userId));

  // Load collaborated users on component mount
  useEffect(() => {
    if (user) {
      loadCollaboratedUsers();
    }
  }, [user]);

  const loadCollaboratedUsers = async () => {
    if (!user) return;

    setProcessing(true);
    try {
      const collaborated = await getCollaboratedUsers(user.id);
      // Filter out users who are already members
      const availableUsers = collaborated.filter(
        (u) => !memberUserIds.has(u.id)
      );
      setCollaboratedUsers(availableUsers);
    } catch (error) {
      console.error("Error loading collaborated users:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleEmailSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;

    setSearching(true);
    setSearchResults([]);

    try {
      console.log("🔍 Searching for email:", searchEmail.trim());
      const results = await searchUsersGlobally(searchEmail.trim());
      console.log("📋 Search results:", results);

      // Filter out users who are already members
      const availableResults = results.filter((u) => !memberUserIds.has(u.id));
      console.log("✅ Available results (not members):", availableResults);

      setSearchResults(availableResults);
    } catch (error) {
      console.error("❌ Error searching users:", error);
      alert("Failed to search users. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const toggleUserSelection = (
    userId: string,
    role: UserRole = "participant"
  ) => {
    const newSelection = new Map(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.set(userId, role);
    }
    setSelectedUsers(newSelection);
  };

  const handleBulkAdd = async () => {
    if (selectedUsers.size === 0) {
      alert("Please select at least one user to add.");
      return;
    }

    setProcessing(true);
    try {
      const membersToAdd = Array.from(selectedUsers.entries()).map(
        ([userId, role]) => ({
          userId,
          role,
        })
      );

      await bulkAddWorkspaceMembers(workspaceId, membersToAdd);

      const addedNames = membersToAdd.map(({ userId }) => {
        const user =
          collaboratedUsers.find((u) => u.id === userId) ||
          searchResults.find((u) => u.id === userId);
        return user?.name || "Unknown User";
      });

      alert(`✅ Added ${addedNames.length} members: ${addedNames.join(", ")}`);
      setSelectedUsers(new Map());
      onMembersAdded();
      onClose();
    } catch (error) {
      console.error("Error adding members:", error);
      alert("Failed to add members. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleSingleAdd = async (
    userToAdd: User,
    role: UserRole = "participant"
  ) => {
    setProcessing(true);
    try {
      await addWorkspaceMember(workspaceId, userToAdd.id, role);
      alert(`✅ ${userToAdd.name} added as ${role}!`);
      onMembersAdded();
      onClose();
    } catch (error: any) {
      console.error("Error adding member:", error);
      if (error.message.includes("already a member")) {
        alert(`⚠️ ${userToAdd.name} is already a member of this workspace.`);
      } else {
        alert("Failed to add member. Please try again.");
      }
    } finally {
      setProcessing(false);
    }
  };

  const UserCard = ({
    user,
    showRoleSelector = false,
    isSelected = false,
  }: {
    user: User;
    showRoleSelector?: boolean;
    isSelected?: boolean;
  }) => (
    <div
      className={`p-3 rounded-lg border-2 transition-all ${
        isSelected
          ? "border-primary bg-primary/5"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
            <span className="text-white font-bold">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{user.name}</h4>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showRoleSelector && (
            <select
              value={selectedUsers.get(user.id) || "participant"}
              onChange={(e) => {
                const newSelection = new Map(selectedUsers);
                newSelection.set(user.id, e.target.value as UserRole);
                setSelectedUsers(newSelection);
              }}
              className="text-sm border border-gray-300 rounded px-2 py-1"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="participant">👤 Participant</option>
              <option value="verifier">🔒 Verifier</option>
              <option value="manager">📊 Manager</option>
              <option value="admin">👑 Admin</option>
            </select>
          )}

          <button
            onClick={() =>
              showRoleSelector
                ? toggleUserSelection(user.id)
                : handleSingleAdd(user)
            }
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              isSelected || !showRoleSelector
                ? "bg-primary text-white hover:bg-primary-dark"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {showRoleSelector ? (isSelected ? "Selected" : "Select") : "Add"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Add Team Members
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab("collaborated")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === "collaborated"
                  ? "bg-primary !text-white"
                  : "bg-gray-100 hover:bg-gray-200 !text-gray-700"
              }`}
            >
              👥 Previous Collaborators
            </button>
            <button
              onClick={() => setActiveTab("search")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === "search"
                  ? "bg-primary !text-white"
                  : "bg-gray-100 hover:bg-gray-200 !text-gray-700"
              }`}
            >
              🔍 Search by Email
            </button>
            <button
              onClick={() => setActiveTab("bulk")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === "bulk"
                  ? "bg-primary !text-white"
                  : "bg-gray-100 hover:bg-gray-200 !text-gray-700"
              }`}
            >
              📝 Bulk Add
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Previous Collaborators Tab */}
          {activeTab === "collaborated" && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  People you've worked with before
                </h3>
                <p className="text-sm text-gray-600">
                  Select users from your previous collaborations to add to this
                  workspace.
                </p>
              </div>

              {processing ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Loading collaborators...</div>
                </div>
              ) : collaboratedUsers.length > 0 ? (
                <div className="space-y-3">
                  {collaboratedUsers.map((user) => (
                    <UserCard
                      key={user.id}
                      user={user}
                      showRoleSelector={true}
                      isSelected={selectedUsers.has(user.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-3 opacity-60">👥</div>
                  <p className="text-lg font-medium mb-1">
                    No Previous Collaborators
                  </p>
                  <p className="text-sm">
                    You haven't collaborated with anyone yet, or they're already
                    members.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Search Tab */}
          {activeTab === "search" && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Search for users by email
                </h3>
                <form onSubmit={handleEmailSearch} className="flex gap-2">
                  <input
                    type="email"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    placeholder="Enter email address..."
                    className="input-field flex-1"
                  />
                  <button
                    type="submit"
                    disabled={searching || !searchEmail.trim()}
                    className="btn-primary px-6"
                  >
                    {searching ? "Searching..." : "Search"}
                  </button>
                </form>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-3">
                  {searchResults.map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </div>
              )}

              {searchEmail && !searching && searchResults.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-3 opacity-60">🔍</div>
                  <p className="text-lg font-medium mb-1">No users found</p>
                  <p className="text-sm mb-3">
                    No users found with email "{searchEmail}" or they're already
                    members.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-left">
                    <p className="text-sm text-blue-800">
                      <strong>💡 Tip:</strong> Make sure the email is spelled
                      correctly. If the user exists but isn't found, they may
                      need to sign up first.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bulk Add Tab */}
          {activeTab === "bulk" && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Bulk add multiple members
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Add multiple members at once. You can select from previous
                  collaborators or search results.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default role for new members
                  </label>
                  <select
                    value={bulkRole}
                    onChange={(e) => setBulkRole(e.target.value as UserRole)}
                    className="input-field"
                  >
                    <option value="participant">👤 Participant</option>
                    <option value="verifier">🔒 Verifier</option>
                    <option value="manager">📊 Manager</option>
                    <option value="admin">👑 Admin</option>
                  </select>
                </div>

                {selectedUsers.size > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Selected Members ({selectedUsers.size})
                    </h4>
                    <div className="space-y-2">
                      {Array.from(selectedUsers.entries()).map(
                        ([userId, role]) => {
                          const user =
                            collaboratedUsers.find((u) => u.id === userId) ||
                            searchResults.find((u) => u.id === userId);
                          return user ? (
                            <div
                              key={userId}
                              className="flex items-center justify-between bg-white p-2 rounded border"
                            >
                              <span className="font-medium">{user.name}</span>
                              <span className="text-sm text-gray-600">
                                {role}
                              </span>
                            </div>
                          ) : null;
                        }
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 sm:p-6">
          <div className="flex gap-3 justify-end">
            <button onClick={onClose} className="btn-secondary">
              Cancel
            </button>

            {(activeTab === "collaborated" || activeTab === "bulk") &&
              selectedUsers.size > 0 && (
                <button
                  onClick={handleBulkAdd}
                  disabled={processing}
                  className="btn-primary"
                >
                  {processing
                    ? "Adding..."
                    : `Add ${selectedUsers.size} Members`}
                </button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
