import { signOut } from "firebase/auth";
import { useState } from "react";
import { auth } from "../firebase";
import { useStore } from "../store";
import Avatar from "./Avatar";
import LabelManagement from "./LabelManagement";
import WorkspaceSettings from "./WorkspaceSettings";

interface SettingsProps {
  onClose: () => void;
}

export default function Settings({ onClose }: SettingsProps) {
  const { user, currentWorkspace, labels, resetStore } = useStore();
  const [showWorkspaceSettings, setShowWorkspaceSettings] = useState(false);
  const [showLabelManagement, setShowLabelManagement] = useState(false);

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            {/* Profile Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Profile
              </h3>
              <div className="card flex items-center gap-4">
                <Avatar
                  name={user?.name || "?"}
                  photoURL={user?.photoURL}
                  size={64}
                />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    {user?.name}
                  </div>
                  <div className="text-sm text-gray-600">{user?.email}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Time Zone: {user?.timeZone || "UTC"}
                  </div>
                </div>
              </div>
            </div>

            {/* Your Role (Read-Only) */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Your Role
              </h3>
              <div className="card bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">
                    {user?.role === "admin" && "👑"}
                    {user?.role === "manager" && "📊"}
                    {user?.role === "verifier" && "🔒"}
                    {user?.role === "participant" && "👤"}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-lg text-gray-900 capitalize">
                      {user?.role}
                    </div>
                    <div className="text-sm text-gray-600">
                      {user?.role === "participant" &&
                        "Check in to assigned slots"}
                      {user?.role === "verifier" &&
                        "Verify attendance + check in"}
                      {user?.role === "manager" &&
                        "Create slots, verify, check in"}
                      {user?.role === "admin" && "Full system access"}
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                {user?.role === "admin"
                  ? "You can manage other users' roles below"
                  : "Contact an administrator to change your role"}
              </p>
            </div>

            {/* Workspace Settings */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span>🏢</span>
                Workspace
              </h3>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      {currentWorkspace?.name}
                      {currentWorkspace?.ownerId === user?.id && (
                        <span className="text-sm ml-2">👑</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {currentWorkspace?.description || "No description"}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {currentWorkspace?.isPublic && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          🌐 Public
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowWorkspaceSettings(true)}
                    className="btn-secondary text-sm py-2"
                  >
                    ⚙️ Edit
                  </button>
                </div>
              </div>
              {currentWorkspace?.ownerId === user?.id && (
                <p className="text-xs text-gray-500 mt-2">
                  💡 Manage team members via the <strong>👥 Team</strong> button
                  in the header
                </p>
              )}
            </div>

            {/* Label Management */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span>🏷️</span>
                Labels
              </h3>
              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium text-gray-900">
                      Workspace Labels
                    </div>
                    <div className="text-sm text-gray-500">
                      {
                        labels.filter(
                          (l) => l.workspaceId === currentWorkspace?.id
                        ).length
                      }{" "}
                      label
                      {labels.filter(
                        (l) => l.workspaceId === currentWorkspace?.id
                      ).length !== 1
                        ? "s"
                        : ""}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowLabelManagement(true)}
                    className="btn-primary text-sm py-2"
                  >
                    Manage
                  </button>
                </div>
              </div>
            </div>

            {/* Logout */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full bg-red-50 hover:bg-red-100 text-red-700 font-medium py-3 px-6 rounded-full transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {showWorkspaceSettings && (
        <WorkspaceSettings onClose={() => setShowWorkspaceSettings(false)} />
      )}

      {showLabelManagement && (
        <LabelManagement onClose={() => setShowLabelManagement(false)} />
      )}
    </div>
  );
}
