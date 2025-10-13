import { useStore } from "../store";
import { canExportData, getUserWorkspaceRole } from "../utils/permissions";

interface MobileMenuProps {
  onClose: () => void;
  onViewModeChange: (mode: "week" | "agenda" | "my-agenda") => void;
  onNotificationsClick: () => void;
  onTeamPanelClick: () => void;
  onExportClick: () => void;
  onSettingsClick: () => void;
}

export default function MobileMenu({
  onClose,
  onViewModeChange,
  onNotificationsClick,
  onTeamPanelClick,
  onExportClick,
  onSettingsClick,
}: MobileMenuProps) {
  const {
    user,
    currentWorkspace,
    workspaceMembers,
    workspaces,
    notifications,
    detectedConflicts,
  } = useStore();

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Get user's role in current workspace
  const userRole =
    user && currentWorkspace
      ? getUserWorkspaceRole(user.id, currentWorkspace.id, workspaceMembers)
      : "participant";


  const menuItems = [
    {
      id: "week",
      icon: "📅",
      label: "Week View",
      action: () => onViewModeChange("week"),
    },
    {
      id: "agenda",
      icon: "📋",
      label: "Workspace Agenda",
      action: () => onViewModeChange("agenda"),
    },
    {
      id: "my-agenda",
      icon: "✨",
      label: "My Agenda",
      action: () => onViewModeChange("my-agenda"),
      badge:
        detectedConflicts.length > 0 ? detectedConflicts.length : undefined,
    },
    {
      id: "notifications",
      icon: "🔔",
      label: "Notifications",
      action: onNotificationsClick,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      id: "team",
      icon: "👥",
      label: "Manage Team",
      action: onTeamPanelClick,
    },
    ...(canExportData(user, userRole)
      ? [
          {
            id: "export",
            icon: "📤",
            label: "Export Data",
            action: onExportClick,
          },
        ]
      : []),
    {
      id: "settings",
      icon: "⚙️",
      label: "Settings",
      action: onSettingsClick,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:hidden z-50">
      <div className="bg-white rounded-t-3xl shadow-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Menu</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center transition-colors touch-manipulation"
            >
              <span className="text-lg">✕</span>
            </button>
          </div>

          <div className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  item.action();
                  onClose();
                }}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-lg font-medium text-gray-900">
                    {item.label}
                  </span>
                </div>
                {item.badge && (
                  <span className="bg-red-500 text-white text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-600">{currentWorkspace?.name}</p>
              <p className="text-xs text-gray-500 mt-1">
                {user?.name} · <span className="capitalize">{userRole}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
