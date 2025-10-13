import { formatDistanceToNow } from "date-fns";
import { useEffect } from "react";
import {
  approveJoinRequest,
  createNotification,
  getPendingRequests,
  markNotificationAsRead,
  rejectJoinRequest,
  subscribeToNotifications,
} from "../services/requestService";
import { addWorkspaceMember } from "../services/workspaceService";
import { useStore } from "../store";

interface NotificationsPanelProps {
  onClose: () => void;
}

export default function NotificationsPanel({
  onClose,
}: NotificationsPanelProps) {
  const { user, notifications, setNotifications } = useStore();

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToNotifications(user.id, setNotifications);
    return () => unsubscribe();
  }, [user, setNotifications]);

  const handleApproveRequest = async (notification: any) => {
    if (!notification.requestId || !notification.workspaceId) return;

    try {
      // Get pending requests to find the user ID
      const requests = await getPendingRequests(notification.workspaceId);
      const request = requests.find((r) => r.id === notification.requestId);

      if (!request) {
        alert("Request not found");
        return;
      }

      // Approve request
      await approveJoinRequest(notification.requestId, user!.id);

      // Add user to workspace
      await addWorkspaceMember(
        notification.workspaceId,
        request.userId,
        "participant"
      );

      // Notify requester
      await createNotification(
        request.userId,
        "request_approved",
        "Request Approved! 🎉",
        `Your request to join has been approved!`,
        notification.workspaceId
      );

      // Mark as read (non-critical - don't fail if this errors)
      try {
        await markNotificationAsRead(notification.id);
      } catch (markError) {
        console.warn("Failed to mark notification as read:", markError);
        // Don't throw - this is not critical to the approval process
      }

      alert("✅ Request approved! User has been added to the workspace.");
    } catch (error) {
      console.error("Error approving request:", error);
      alert("Failed to approve request. Please try again.");
    }
  };

  const handleRejectRequest = async (notification: any) => {
    if (!notification.requestId) return;

    try {
      await rejectJoinRequest(notification.requestId, user!.id);
      
      // Mark as read (non-critical - don't fail if this errors)
      try {
        await markNotificationAsRead(notification.id);
      } catch (markError) {
        console.warn("Failed to mark notification as read:", markError);
        // Don't throw - this is not critical to the rejection process
      }

      alert("Request rejected.");
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("Failed to reject request. Please try again.");
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const sortedNotifications = [...notifications].sort(
    (a, b) => b.createdAt - a.createdAt
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-sm font-medium px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Stay updated with workspace activities
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
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {sortedNotifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔔</div>
              <p className="text-gray-500">No notifications yet</p>
              <p className="text-sm text-gray-400 mt-2">
                You'll see workspace updates and requests here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sortedNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 sm:p-6 hover:bg-gray-50 transition-colors ${
                    !notification.read ? "bg-blue-50/50" : ""
                  }`}
                >
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                        <span className="text-white text-lg">
                          {notification.type === "join_request"
                            ? "🙋"
                            : notification.type === "request_approved"
                            ? "✅"
                            : "📢"}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatDistanceToNow(notification.createdAt, {
                          addSuffix: true,
                        })}
                      </p>

                      {/* Actions for join requests */}
                      {notification.type === "join_request" &&
                        !notification.read && (
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleApproveRequest(notification)}
                              className="btn-primary text-sm py-2 px-4"
                            >
                              ✅ Approve
                            </button>
                            <button
                              onClick={() => handleRejectRequest(notification)}
                              className="btn-secondary text-sm py-2 px-4"
                            >
                              ❌ Reject
                            </button>
                          </div>
                        )}

                      {/* Mark as read */}
                      {!notification.read &&
                        notification.type !== "join_request" && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-xs text-primary hover:text-primary-dark mt-2"
                          >
                            Mark as read
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
