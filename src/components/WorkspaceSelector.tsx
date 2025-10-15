import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "../firebase";
import {
  createWorkspace,
  getUserWorkspaces,
} from "../services/workspaceService";
import { useStore } from "../store";
import type { Workspace } from "../types";
import PublicWorkspaceDiscovery from "./PublicWorkspaceDiscovery";

interface WorkspaceSelectorProps {
  onWorkspaceSelected: () => void;
}

export default function WorkspaceSelector({
  onWorkspaceSelected,
}: WorkspaceSelectorProps) {
  const { user, setCurrentWorkspace, workspaces, setWorkspaces, resetStore } =
    useStore();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState("");
  const [newWorkspacePublic, setNewWorkspacePublic] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    if (user) {
      loadWorkspaces();
    } else {
      // Clear workspaces when user logs out
      setWorkspaces([]);
    }
  }, [user]);

  const loadWorkspaces = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const userWorkspaces = await getUserWorkspaces(user.id);
      setWorkspaces(userWorkspaces);

      // Auto-select if only one workspace
      if (userWorkspaces.length === 1) {
        handleSelectWorkspace(userWorkspaces[0]);
      }
    } catch (error) {
      console.error("Error loading workspaces:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newWorkspaceName.trim()) return;

    setCreating(true);
    try {
      // Ensure description is optional - convert empty string to undefined
      const description = newWorkspaceDesc.trim() || undefined;

      const workspaceId = await createWorkspace(
        user.id,
        newWorkspaceName.trim(),
        description,
        newWorkspacePublic
      );

      const newWorkspace: Workspace = {
        id: workspaceId,
        name: newWorkspaceName.trim(),
        description: description,
        ownerId: user.id,
        isPublic: newWorkspacePublic,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setWorkspaces([...workspaces, newWorkspace]);
      setNewWorkspaceName("");
      setNewWorkspaceDesc("");
      setNewWorkspacePublic(false);
      setShowCreate(false);

      // Auto-select new workspace
      handleSelectWorkspace(newWorkspace);
    } catch (error) {
      console.error("Error creating workspace:", error);
      alert("Failed to create workspace. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleSelectWorkspace = async (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    localStorage.setItem("lastWorkspaceId", workspace.id);
    onWorkspaceSelected();
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Reset all store state to prevent data leakage between users
      resetStore();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
        {/* Logout Button */}
        <div className="absolute top-4 right-4">
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Sign Out"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Select Workspace
          </h1>
          <p className="text-sm text-gray-600">
            Choose a team or create a new one
          </p>
          {user && (
            <p className="text-xs text-gray-500 mt-2">
              Signed in as {user.name} ({user.email})
            </p>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : (
          <>
            {/* Existing Workspaces */}
            {workspaces.length > 0 && (
              <div className="space-y-2 mb-4">
                {workspaces.map((workspace) => (
                  <button
                    key={workspace.id}
                    onClick={() => handleSelectWorkspace(workspace)}
                    className="w-full text-left p-4 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all"
                  >
                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                      {workspace.ownerId === user?.id && (
                        <span className="text-sm">👑</span>
                      )}
                      {workspace.name}
                    </div>
                    {workspace.description && (
                      <div className="text-sm text-gray-600 mt-1">
                        {workspace.description}
                      </div>
                    )}
                    {workspace.ownerId === user?.id && (
                      <div className="text-xs text-primary mt-1">
                        You're the admin
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Create or Join Workspace */}
            {!showCreate && !showJoin ? (
              <div className="space-y-2">
                <button
                  onClick={() => setShowCreate(true)}
                  className="btn-primary w-full"
                >
                  ➕ Create New Workspace
                </button>
                <button
                  onClick={() => setShowDiscovery(true)}
                  className="btn-secondary w-full"
                >
                  🌐 Browse Public Workspaces
                </button>
                <button
                  onClick={() => setShowJoin(true)}
                  className="btn-secondary w-full text-sm"
                >
                  🔗 Join with Code
                </button>
              </div>
            ) : showCreate ? (
              <form onSubmit={handleCreateWorkspace} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Workspace Name *
                  </label>
                  <input
                    type="text"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    className="input-field"
                    placeholder="e.g., Tennis Club, Gym Team, Consulting Group"
                    required
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This will be your team's workspace
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description{" "}
                    <span className="text-gray-500 font-normal">
                      (Optional)
                    </span>
                  </label>
                  <textarea
                    value={newWorkspaceDesc}
                    onChange={(e) => setNewWorkspaceDesc(e.target.value)}
                    className="input-field resize-none"
                    rows={2}
                    placeholder="e.g., Weekly training sessions for tennis coaches (leave blank if not needed)"
                    style={{ minHeight: "60px" }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    You can add a description later in workspace settings
                  </p>
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newWorkspacePublic}
                      onChange={(e) => setNewWorkspacePublic(e.target.checked)}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">
                      🌐 Make this workspace public (anyone can request to join)
                    </span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className="btn-primary flex-1"
                  >
                    {creating ? "Creating..." : "Create Workspace"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreate(false);
                      setNewWorkspacePublic(false);
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Workspace ID
                  </label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    className="input-field"
                    placeholder="Enter workspace ID to join"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ask your admin for the workspace ID
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (joinCode.trim()) {
                        alert(
                          "Join workspace feature coming soon! Ask your admin to invite you via email."
                        );
                      }
                    }}
                    className="btn-primary flex-1"
                  >
                    Join Workspace
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowJoin(false);
                      setJoinCode("");
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {workspaces.length === 0 && !showCreate && !showJoin && (
              <p className="text-xs text-gray-500 text-center mt-4">
                Create your first workspace or discover public ones
              </p>
            )}
          </>
        )}
      </div>

      {/* Public Workspace Discovery Modal */}
      {showDiscovery && (
        <PublicWorkspaceDiscovery onClose={() => setShowDiscovery(false)} />
      )}
    </div>
  );
}
