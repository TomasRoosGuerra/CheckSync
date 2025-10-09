import { signOut } from "firebase/auth";
import { useState } from "react";
import { auth } from "../firebase";
import { updateUserProfile } from "../services/firestoreService";
import { useStore } from "../store";
import type { UserRole } from "../types";
import UserConnections from "./UserConnections";

interface SettingsProps {
  onClose: () => void;
}

export default function Settings({ onClose }: SettingsProps) {
  const { user, setUser, users } = useStore();
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [showConnections, setShowConnections] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleRoleChange = async (role: UserRole) => {
    if (user) {
      try {
        await updateUserProfile(user.id, { role });
        setUser({ ...user, role });
      } catch (error) {
        console.error("Error updating role:", error);
        alert("Failed to update role. Please try again.");
      }
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

            {/* Role Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Role & Permissions</h3>
              <div className="space-y-2">
                {(["participant", "verifier", "manager", "admin"] as UserRole[]).map(
                  (role) => (
                    <label
                      key={role}
                      className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        name="role"
                        checked={user?.role === role}
                        onChange={() => handleRoleChange(role)}
                        className="w-4 h-4 text-primary"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 capitalize flex items-center gap-2">
                          {role === "admin" && "👑"}
                          {role === "manager" && "📊"}
                          {role === "verifier" && "🔒"}
                          {role === "participant" && "👤"}
                          {role}
                        </div>
                        <div className="text-sm text-gray-500">
                          {role === "participant" && "Check in to assigned slots"}
                          {role === "verifier" && "Verify attendance + check in"}
                          {role === "manager" && "Create slots, verify, check in"}
                          {role === "admin" && "Full access to everything"}
                        </div>
                      </div>
                    </label>
                  )
                )}
              </div>
            </div>

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
    </div>
  );
}
