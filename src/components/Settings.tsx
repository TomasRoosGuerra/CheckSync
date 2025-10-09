import { signOut } from "firebase/auth";
import { useState } from "react";
import { auth } from "../firebase";
import { useStore } from "../store";
import UserConnections from "./UserConnections";
import UserManagement from "./UserManagement";
import AddMemberPanel from "./AddMemberPanel";

interface SettingsProps {
  onClose: () => void;
}

export default function Settings({ onClose }: SettingsProps) {
  const { user, setUser, users, currentWorkspace } = useStore();
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [showConnections, setShowConnections] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
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
                <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Role</h3>
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
                      {user?.role === "participant" && "Check in to assigned slots"}
                      {user?.role === "verifier" && "Verify attendance + check in"}
                      {user?.role === "manager" && "Create slots, verify, check in"}
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

            {/* Admin: Manage All Users */}
            {currentWorkspace?.ownerId === user?.id && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>👑</span>
                  Workspace Admin
                </h3>
                <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-4 border-2 border-primary/30">
                  <div className="mb-3">
                    <div className="font-semibold text-gray-900 mb-1">
                      ➕ Add & Manage Team Members
                    </div>
                    <div className="text-sm text-gray-600">
                      Search users by email and assign roles
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddMember(true)}
                    className="btn-primary w-full text-base py-3"
                  >
                    ➕ Add Team Members
                  </button>
                </div>
              </div>
            )}

            {/* Notifications */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Notifications
              </h3>
              <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <div>
                  <div className="font-medium text-gray-900">
                    Enable Notifications
                  </div>
                  <div className="text-sm text-gray-500">
                    Get reminders for check-ins and verifications
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="w-5 h-5 text-primary rounded focus:ring-primary"
                />
              </label>
            </div>

            {/* Theme */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Appearance
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setTheme("light")}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    theme === "light"
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="text-2xl mb-1">☀️</div>
                  <div className="font-medium">Light</div>
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    theme === "dark"
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="text-2xl mb-1">🌙</div>
                  <div className="font-medium">Dark</div>
                </button>
              </div>
            </div>

            {/* User Connections */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Connections
              </h3>
              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium text-gray-900">
                      Connected Users
                    </div>
                    <div className="text-sm text-gray-500">
                      {users.filter((u) => u.id !== user?.id).length} connection
                      {users.filter((u) => u.id !== user?.id).length !== 1
                        ? "s"
                        : ""}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowConnections(true)}
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

      {/* User Connections Modal */}
      {showConnections && (
        <UserConnections onClose={() => setShowConnections(false)} />
      )}
      
      {/* User Management Modal (Admin Only) */}
      {showUserManagement && (
        <UserManagement onClose={() => setShowUserManagement(false)} />
      )}
      {showAddMember && (
        <AddMemberPanel onClose={() => setShowAddMember(false)} />
      )}
    </div>
  );
}
