import { useState } from "react";
import { createWorkspace } from "../services/workspaceService";
import { useStore } from "../store";
import type { Workspace } from "../types";

interface WorkspaceQuickSwitcherProps {
  onClose: () => void;
}

export default function WorkspaceQuickSwitcher({
  onClose,
}: WorkspaceQuickSwitcherProps) {
  const { user, workspaces, currentWorkspace, setCurrentWorkspace } =
    useStore();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPublic, setNewPublic] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleSwitch = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    localStorage.setItem("lastWorkspaceId", workspace.id);
    onClose();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newName.trim()) return;

    setCreating(true);
    try {
      // Ensure description is optional - convert empty string to undefined
      const description = newDesc.trim() || undefined;

      const workspaceId = await createWorkspace(
        user.id,
        newName.trim(),
        description,
        newPublic
      );

      const newWorkspace: Workspace = {
        id: workspaceId,
        name: newName.trim(),
        description: description,
        ownerId: user.id,
        isPublic: newPublic,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      alert(`✅ Workspace "${newWorkspace.name}" created!`);
      setCurrentWorkspace(newWorkspace);
      localStorage.setItem("lastWorkspaceId", newWorkspace.id);
      onClose();
    } catch (error) {
      alert("Failed to create workspace.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Workspaces</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
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

        <div className="p-6 space-y-4">
          {/* Current Workspace */}
          {workspaces.map((workspace) => {
            const isCurrent = workspace.id === currentWorkspace?.id;
            return (
              <button
                key={workspace.id}
                onClick={() => !isCurrent && handleSwitch(workspace)}
                disabled={isCurrent}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  isCurrent
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-primary/50 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        {workspace.name}
                        {workspace.ownerId === user?.id && (
                          <span className="text-sm">👑</span>
                        )}
                      </h3>
                      {workspace.description && (
                        <p className="text-sm text-gray-600 line-clamp-1">
                          {workspace.description}
                        </p>
                      )}
                    </div>
                  </div>
                  {isCurrent && (
                    <span className="bg-primary text-white text-xs font-medium px-3 py-1 rounded-full">
                      Current
                    </span>
                  )}
                </div>
              </button>
            );
          })}

          {/* Create New Workspace */}
          {!showCreate ? (
            <button
              onClick={() => setShowCreate(true)}
              className="w-full p-4 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 transition-all text-center"
            >
              <span className="text-primary font-semibold">
                ➕ Create New Workspace
              </span>
            </button>
          ) : (
            <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-4 border-2 border-primary/20">
              <form onSubmit={handleCreate} className="space-y-3">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Workspace name"
                  className="input-field"
                  required
                  autoFocus
                />
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Description (optional - leave blank if not needed)"
                  className="input-field resize-none"
                  rows={2}
                />
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPublic}
                    onChange={(e) => setNewPublic(e.target.checked)}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-gray-700">🌐 Make public</span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className="btn-primary flex-1"
                  >
                    {creating ? "Creating..." : "Create"}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
