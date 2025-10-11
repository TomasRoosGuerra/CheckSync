import { useState } from "react";
import {
  addConnection,
  getConnectedUsers,
  removeConnection,
  searchUserByEmail,
} from "../services/firestoreService";
import { useStore } from "../store";

interface UserConnectionsProps {
  onClose: () => void;
}

export default function UserConnections({ onClose }: UserConnectionsProps) {
  const { user, users, setUsers } = useStore();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleAddConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !email.trim()) return;

    setLoading(true);
    setMessage("");

    try {
      // Search for user by email
      const foundUser = await searchUserByEmail(email.trim().toLowerCase());

      if (!foundUser) {
        setMessage("User not found. Make sure they have signed up first.");
        setLoading(false);
        return;
      }

      if (foundUser.id === user.id) {
        setMessage("You cannot add yourself as a connection.");
        setLoading(false);
        return;
      }

      if (users.some((u) => u.id === foundUser.id)) {
        setMessage("This user is already in your connections.");
        setLoading(false);
        return;
      }

      // Add connection
      await addConnection(user.id, foundUser.id);

      // Refresh connected users
      const updatedConnections = await getConnectedUsers(user.id);
      setUsers([user, ...updatedConnections]);

      setMessage(`Successfully connected with ${foundUser.name}!`);
      setEmail("");
    } catch (error) {
      console.error("Error adding connection:", error);
      setMessage("Failed to add connection. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveConnection = async (userId: string) => {
    if (!user) return;

    const userName = users.find((u) => u.id === userId)?.name || "this user";
    if (!confirm(`Remove ${userName} from your connections?`)) return;

    setLoading(true);
    try {
      await removeConnection(user.id, userId);

      // Refresh connected users
      const updatedConnections = await getConnectedUsers(user.id);
      setUsers([user, ...updatedConnections]);

      setMessage(`Successfully removed ${userName} from connections.`);
    } catch (error) {
      console.error("Error removing connection:", error);
      setMessage("Failed to remove connection. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Manage Connections
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Add New Connection */}
          <form onSubmit={handleAddConnection} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Connection by Email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field flex-1"
                placeholder="user@example.com"
                required
                disabled={loading}
              />
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Adding..." : "Add"}
              </button>
            </div>
            {message && (
              <p
                className={`text-sm mt-2 ${
                  message.includes("Successfully")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {message}
              </p>
            )}
          </form>

          {/* Connected Users List */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Connected Users ({users.filter((u) => u.id !== user?.id).length})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {users
                .filter((u) => u.id !== user?.id)
                .map((connectedUser) => (
                  <div
                    key={connectedUser.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                      {connectedUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">
                        {connectedUser.name}
                      </div>
                      <div className="text-sm text-gray-600 truncate">
                        {connectedUser.email}
                      </div>
                    </div>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full flex-shrink-0">
                      {connectedUser.role}
                    </span>
                    <button
                      onClick={() => handleRemoveConnection(connectedUser.id)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors flex-shrink-0"
                      title="Remove connection"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                ))}
              {users.filter((u) => u.id !== user?.id).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No connections yet</p>
                  <p className="text-xs mt-1">
                    Add users by their email to collaborate
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <button onClick={onClose} className="btn-secondary w-full">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
