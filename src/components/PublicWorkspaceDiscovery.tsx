import { useState, useEffect } from "react";
import { useStore } from "../store";
import { getPublicWorkspaces } from "../services/requestService";
import { createJoinRequest, createNotification } from "../services/requestService";
import { getUserProfile } from "../services/firestoreService";

interface PublicWorkspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  isPublic: boolean;
  createdAt: number;
  updatedAt: number;
  memberCount?: number;
  ownerName?: string;
}

interface PublicWorkspaceDiscoveryProps {
  onClose: () => void;
}

export default function PublicWorkspaceDiscovery({
  onClose,
}: PublicWorkspaceDiscoveryProps) {
  const { user, workspaces } = useStore();
  const [publicWorkspaces, setPublicWorkspaces] = useState<PublicWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [requesting, setRequesting] = useState<string | null>(null);

  useEffect(() => {
    loadPublicWorkspaces();
  }, []);

  const loadPublicWorkspaces = async () => {
    try {
      const workspaces = await getPublicWorkspaces();
      
      // Load owner names
      const workspacesWithDetails = await Promise.all(
        workspaces.map(async (ws: any) => {
          const owner = await getUserProfile(ws.ownerId);
          return {
            ...ws,
            ownerName: owner?.name || "Unknown",
          };
        })
      );
      
      setPublicWorkspaces(workspacesWithDetails);
    } catch (error) {
      console.error("Error loading public workspaces:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestJoin = async (workspace: PublicWorkspace) => {
    if (!user) return;

    setRequesting(workspace.id);
    try {
      // Create join request
      const requestId = await createJoinRequest(
        workspace.id,
        user.id,
        `${user.name} would like to join your workspace`
      );

      // Notify workspace owner
      await createNotification(
        workspace.ownerId,
        "join_request",
        "New Join Request",
        `${user.name} wants to join ${workspace.name}`,
        workspace.id,
        requestId
      );

      alert("✅ Request sent! The workspace owner will review your request.");
      onClose();
    } catch (error) {
      console.error("Error sending request:", error);
      alert("Failed to send request. Please try again.");
    } finally {
      setRequesting(null);
    }
  };

  const userWorkspaceIds = new Set(workspaces.map((w) => w.id));
  
  const filteredWorkspaces = publicWorkspaces.filter((ws) => {
    const matchesSearch =
      ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ws.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const notMember = !userWorkspaceIds.has(ws.id);
    return matchesSearch && notMember;
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Discover Public Workspaces
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Browse and request to join public teams
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

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search public workspaces..."
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

        {/* Workspace Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-gray-500">Loading public workspaces...</p>
            </div>
          ) : filteredWorkspaces.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-500">
                {searchQuery
                  ? "No public workspaces found matching your search"
                  : "No public workspaces available"}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Try creating your own workspace or ask for an invitation
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWorkspaces.map((workspace) => (
                <div
                  key={workspace.id}
                  className="p-5 rounded-xl border-2 border-gray-200 bg-white hover:border-primary/50 hover:shadow-lg transition-all"
                >
                  {/* Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                      🌐 Public
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center mb-3">
                    <span className="text-white font-bold text-xl">
                      {workspace.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Name */}
                  <h3 className="font-bold text-gray-900 text-lg mb-1">
                    {workspace.name}
                  </h3>

                  {/* Description */}
                  {workspace.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {workspace.description}
                    </p>
                  )}

                  {/* Owner */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                    <span>👤 By {workspace.ownerName}</span>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleRequestJoin(workspace)}
                    disabled={requesting === workspace.id}
                    className="btn-primary w-full text-sm py-2"
                  >
                    {requesting === workspace.id
                      ? "Sending..."
                      : "🙋 Request to Join"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50">
          <p className="text-sm text-gray-600 text-center">
            💡 Tip: Public workspaces allow anyone to request to join. The owner will
            review your request.
          </p>
        </div>
      </div>
    </div>
  );
}

