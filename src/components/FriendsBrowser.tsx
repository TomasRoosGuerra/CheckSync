import { useState } from "react";
import { useStore } from "../store";

interface FriendsBrowserProps {
  onClose: () => void;
}

export default function FriendsBrowser({ onClose }: FriendsBrowserProps) {
  const { user, users, currentWorkspace, workspaceMembers } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searching, setSearching] = useState(false);

  // Get current workspace members
  const currentMembers = workspaceMembers.filter(
    (m) => m.workspaceId === currentWorkspace?.id
  );

  // Filter team members
  const filteredMembers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;

    setSearching(true);

    try {
      // In production, you'd query Firestore by email
      // For now, just show a message
      alert(
        "Email search coming soon! For now, users need to sign up first, then you can find them in your team."
      );
    } catch (error) {
      console.error("Error searching user:", error);
      alert("Failed to find user");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Team Members</h2>
              <p className="text-sm text-gray-600 mt-1">
                {currentWorkspace?.name} · {filteredMembers.length} members
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close"
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

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
        </div>

        {/* Members List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <p className="text-gray-500 mb-4">
                {searchQuery
                  ? "No members found matching your search"
                  : "No team members yet"}
              </p>
              {!searchQuery && (
                <p className="text-sm text-gray-400">
                  Invite people to join your workspace
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMembers.map((member) => {
                const memberData = currentMembers.find(
                  (m) => m.userId === member.id
                );
                const isYou = member.id === user?.id;
                const isOwner = currentWorkspace?.ownerId === member.id;

                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-primary/50 hover:bg-gray-50 transition-all"
                  >
                    {/* Avatar */}
                    {member.photoURL ? (
                      <img
                        src={member.photoURL}
                        alt={member.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {member.name}
                          {isYou && (
                            <span className="text-sm text-gray-500 font-normal ml-2">
                              (You)
                            </span>
                          )}
                        </h3>
                        {isOwner && <span className="text-base">👑</span>}
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {member.email}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary capitalize">
                          {memberData?.role || "participant"}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          /* View profile - future feature */
                        }}
                        className="btn-secondary text-sm py-2 px-3"
                      >
                        View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer - Add Member */}
        <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50">
          <form onSubmit={handleSearchByEmail} className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Add New Member
            </label>
            <div className="flex gap-2">
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
                className="btn-primary whitespace-nowrap"
              >
                {searching ? "Searching..." : "➕ Invite"}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              💡 Users must sign up first before you can add them to your
              workspace
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
