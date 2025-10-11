import { doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { db } from "../firebase";
import { useStore } from "../store";
import { isWorkspaceOwner } from "../utils/permissions";

interface WorkspaceSettingsProps {
  onClose: () => void;
}

export default function WorkspaceSettings({ onClose }: WorkspaceSettingsProps) {
  const { user, currentWorkspace, workspaceMembers, timeSlots } = useStore();
  const [name, setName] = useState(currentWorkspace?.name || "");
  const [description, setDescription] = useState(
    currentWorkspace?.description || ""
  );
  const [isPublic, setIsPublic] = useState(currentWorkspace?.isPublic || false);
  const [saving, setSaving] = useState(false);

  const isOwner = isWorkspaceOwner(user, currentWorkspace);
  const memberCount = workspaceMembers.filter(
    (m) => m.workspaceId === currentWorkspace?.id
  ).length;
  const slotCount = timeSlots.length;
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  const handleCopyWorkspaceId = () => {
    if (currentWorkspace) {
      navigator.clipboard.writeText(currentWorkspace.id);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !isOwner) return;

    setSaving(true);
    try {
      const workspaceRef = doc(db, "workspaces", currentWorkspace.id);
      await updateDoc(workspaceRef, {
        name: name.trim(),
        description: description.trim() || null,
        isPublic,
        updatedAt: Date.now(),
      });

      alert("✅ Workspace settings updated!");
      onClose();
    } catch (error) {
      console.error("Error updating workspace:", error);
      alert("Failed to update workspace settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Workspace Settings
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {currentWorkspace?.name}
              </p>
            </div>
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

        <div className="p-6 space-y-6">
          {/* Workspace Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-700">
                {memberCount}
              </div>
              <div className="text-sm text-blue-600 mt-1">Members</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-700">
                {slotCount}
              </div>
              <div className="text-sm text-green-600 mt-1">Time Slots</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-700">
                {isPublic ? "🌐" : "🔒"}
              </div>
              <div className="text-sm text-purple-600 mt-1">
                {isPublic ? "Public" : "Private"}
              </div>
            </div>
          </div>

          {/* Workspace ID (For Sharing) */}
          <div className="bg-gray-50 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Workspace ID (for sharing)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={currentWorkspace?.id || ""}
                readOnly
                className="input-field flex-1 bg-white font-mono text-sm"
              />
              <button
                type="button"
                onClick={handleCopyWorkspaceId}
                className={`btn-secondary whitespace-nowrap transition-all ${
                  showCopySuccess ? "bg-green-100 text-green-700" : ""
                }`}
              >
                {showCopySuccess ? "✅ Copied!" : "📋 Copy"}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Share this ID with people to let them join your workspace
            </p>
          </div>

          {/* Edit Form (Owner Only) */}
          {isOwner ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field resize-none"
                  rows={3}
                  placeholder="Describe your workspace..."
                />
              </div>

              <div>
                <label className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-primary/50 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      🌐 Public Workspace
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Anyone can discover and request to join this workspace
                    </div>
                  </div>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 py-3"
                >
                  {saving ? "Saving..." : "💾 Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <p className="text-gray-600">
                Only the workspace owner can edit these settings.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Contact the admin if changes are needed.
              </p>
            </div>
          )}

          {/* Danger Zone (Owner Only) */}
          {isOwner && (
            <div className="border-2 border-red-200 rounded-xl p-4 bg-red-50">
              <h3 className="text-lg font-bold text-red-700 mb-2">
                ⚠️ Danger Zone
              </h3>
              <p className="text-sm text-red-600 mb-4">
                Deleting this workspace will remove all time slots and member
                associations. This action cannot be undone.
              </p>
              <button
                onClick={() => {
                  if (
                    confirm(
                      `⚠️ Delete "${currentWorkspace?.name}"?\n\nThis will:\n- Remove all time slots\n- Remove all members\n- Cannot be undone!\n\nType the workspace name to confirm.`
                    )
                  ) {
                    alert(
                      "Workspace deletion coming soon. Please export your data first."
                    );
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                🗑️ Delete Workspace
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
