import { useState, useEffect } from "react";
import { useStore } from "../store";
import { 
  createWorkspace, 
  getUserWorkspaces,
} from "../services/workspaceService";
import type { Workspace } from "../types";

interface WorkspaceSelectorProps {
  onWorkspaceSelected: () => void;
}

export default function WorkspaceSelector({ onWorkspaceSelected }: WorkspaceSelectorProps) {
  const { user, setCurrentWorkspace, workspaces, setWorkspaces } = useStore();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState("");
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    loadWorkspaces();
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
      const workspaceId = await createWorkspace(
        user.id,
        newWorkspaceName.trim(),
        newWorkspaceDesc.trim() || undefined
      );
      
      const newWorkspace: Workspace = {
        id: workspaceId,
        name: newWorkspaceName.trim(),
        description: newWorkspaceDesc.trim() || undefined,
        ownerId: user.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      setWorkspaces([...workspaces, newWorkspace]);
      setNewWorkspaceName("");
      setNewWorkspaceDesc("");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Select Workspace</h1>
          <p className="text-sm text-gray-600">
            Choose a team or create a new one
          </p>
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
                      {workspace.ownerId === user?.id && <span className="text-sm">👑</span>}
                      {workspace.name}
                    </div>
                    {workspace.description && (
                      <div className="text-sm text-gray-600 mt-1">
                        {workspace.description}
                      </div>
                    )}
                    {workspace.ownerId === user?.id && (
                      <div className="text-xs text-primary mt-1">You're the admin</div>
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
                  onClick={() => setShowJoin(true)}
                  className="btn-secondary w-full"
                >
                  🔗 Join Existing Workspace
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
                    Description (Optional)
                  </label>
                  <textarea
                    value={newWorkspaceDesc}
                    onChange={(e) => setNewWorkspaceDesc(e.target.value)}
                    className="input-field resize-none"
                    rows={2}
                    placeholder="e.g., Weekly training sessions for tennis coaches"
                  />
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
                    onClick={() => setShowCreate(false)}
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
                        alert("Join workspace feature coming soon! Ask your admin to invite you via email.");
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
                Create your first workspace or join an existing one
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

