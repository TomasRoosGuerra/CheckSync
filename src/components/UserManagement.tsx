import { useState } from "react";
import { useStore } from "../store";
import { updateUserProfile } from "../services/firestoreService";
import type { UserRole } from "../types";
import { getRoleColor, getRoleIcon } from "../utils/permissions";

interface UserManagementProps {
  onClose: () => void;
}

export default function UserManagement({ onClose }: UserManagementProps) {
  const { user, users, setUsers } = useStore();
  const [loading, setLoading] = useState(false);

  if (user?.role !== "admin") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            Only administrators can manage user roles.
          </p>
          <button onClick={onClose} className="btn-primary w-full">
            Close
          </button>
        </div>
      </div>
    );
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setLoading(true);
    try {
      await updateUserProfile(userId, { role: newRole });
      
      // Update local state
      const updatedUsers = users.map((u) =>
        u.id === userId ? { ...u, role: newRole } : u
      );
      setUsers(updatedUsers);
      
      console.log(`✅ Updated ${userId} to ${newRole}`);
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Failed to update role. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                👑 User Management
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Admin-only: Assign roles and permissions
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>

          {/* User List */}
          <div className="space-y-3">
            {users.map((u) => (
              <div
                key={u.id}
                className={`
                  p-4 rounded-lg border-2 transition-all
                  ${u.id === user.id ? "border-primary bg-primary/5" : "border-gray-200"}
                `}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-semibold text-gray-900">{u.name}</div>
                      {u.id === user.id && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">{u.email}</div>
                  </div>
                  
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(u.role)}`}>
                    {getRoleIcon(u.role)} {u.role}
                  </div>
                </div>

                {/* Role Selector (disabled for self to prevent admin lockout) */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Assign Role
                  </label>
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                    disabled={loading || u.id === user.id}
                    className={`
                      input-field text-sm py-2
                      ${u.id === user.id ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                  >
                    <option value="participant">👤 Participant - Check in only</option>
                    <option value="verifier">🔒 Verifier - Verify + check in</option>
                    <option value="manager">📊 Manager - Create slots + verify</option>
                    <option value="admin">👑 Admin - Full access</option>
                  </select>
                  {u.id === user.id && (
                    <p className="text-xs text-gray-500 mt-1">
                      You cannot change your own role (prevents admin lockout)
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 flex gap-2">
            <button onClick={onClose} className="btn-secondary flex-1">
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

