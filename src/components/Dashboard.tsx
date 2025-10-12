import { useState } from "react";
import { useStore } from "../store";
import { canExportData, getUserWorkspaceRole } from "../utils/permissions";
import AgendaView from "./AgendaView";
import DayView from "./DayView";
import Export from "./Export";
import MyAgendaView from "./MyAgendaView";
import NotificationsPanel from "./NotificationsPanel";
import Settings from "./Settings";
import TeamDashboard from "./TeamDashboard";
import TeamPanel from "./TeamPanel";
import TodayWidget from "./TodayWidget";
import WeekCalendar from "./WeekCalendar";
import WorkspaceQuickSwitcher from "./WorkspaceQuickSwitcher";

export default function Dashboard() {
  const {
    user,
    currentWorkspace,
    workspaceMembers,
    notifications,
    viewMode,
    setViewMode,
    detectedConflicts,
    setCurrentWorkspace,
    workspaces,
  } = useStore();
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTeamPanel, setShowTeamPanel] = useState(false);
  const [showWorkspaceSwitcher, setShowWorkspaceSwitcher] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Get user's role in current workspace
  const userRole =
    user && currentWorkspace
      ? getUserWorkspaceRole(user.id, currentWorkspace.id, workspaceMembers)
      : "participant";

  // Check if user is manager/admin in any workspace
  const isManagerOrAdmin = workspaces.some((ws) => {
    const role = getUserWorkspaceRole(user?.id || "", ws.id, workspaceMembers);
    return role === "manager" || role === "admin";
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Mobile Optimized with iPhone Safe Area */}
      <header className="bg-white border-b border-gray-200 sticky-mobile top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <button
                onClick={() => setShowWorkspaceSwitcher(true)}
                className="text-left hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
              >
                <h1 className="text-base sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                  {currentWorkspace?.name || "CheckSync"}
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M19 9l-7 7-7-7"></path>
                  </svg>
                </h1>
                <p className="text-xs text-gray-600">
                  {user?.name} · <span className="capitalize">{userRole}</span>
                </p>
              </button>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {/* View Toggle - All Screens */}
              <div className="flex gap-1">
                <button
                  onClick={() => setViewMode("week")}
                  className={`py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium touch-manipulation rounded-full transition-colors text-gray-900 ${
                    viewMode === "week"
                      ? "bg-primary shadow-md"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                  title="Week View"
                >
                  <span className="sm:hidden">📅</span>
                  <span className="hidden sm:inline">📅 Week</span>
                </button>
                <button
                  onClick={() => setViewMode("agenda")}
                  className={`py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium touch-manipulation rounded-full transition-colors text-gray-900 ${
                    viewMode === "agenda"
                      ? "bg-primary shadow-md"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                  title="Workspace Agenda"
                >
                  <span className="sm:hidden">📋</span>
                  <span className="hidden sm:inline">📋 Agenda</span>
                </button>
                <button
                  onClick={() => setViewMode("my-agenda")}
                  className={`py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium touch-manipulation rounded-full transition-colors relative text-gray-900 ${
                    viewMode === "my-agenda"
                      ? "bg-primary shadow-md"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                  title="My Agenda"
                >
                  <span className="sm:hidden">✨</span>
                  <span className="hidden sm:inline">✨ My Agenda</span>
                  {detectedConflicts.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center font-bold">
                      {detectedConflicts.length}
                    </span>
                  )}
                </button>

                {/* Team Dashboard - Manager/Admin Only */}
                {isManagerOrAdmin && (
                  <button
                    onClick={() => setViewMode("team-dashboard")}
                    className={`py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium touch-manipulation rounded-full transition-colors text-gray-900 ${
                      viewMode === "team-dashboard"
                        ? "bg-primary shadow-md"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                    title="Team Dashboard"
                  >
                    <span className="sm:hidden">📊</span>
                    <span className="hidden sm:inline">📊 Team</span>
                  </button>
                )}
              </div>

              {/* Notifications Button */}
              <button
                onClick={() => setShowNotifications(true)}
                className="btn-secondary py-2 px-2 sm:px-3 text-xs sm:text-sm touch-manipulation relative"
                title="Notifications"
              >
                <span className="text-base">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Team Panel Button - Consolidated */}
              <button
                onClick={() => setShowTeamPanel(true)}
                className="btn-secondary py-2 px-2 sm:px-3 text-xs sm:text-sm touch-manipulation"
                title="Team & Workspaces"
              >
                <span className="hidden sm:inline">👥 Team</span>
                <span className="sm:hidden">👥</span>
              </button>

              {canExportData(user, userRole) && (
                <button
                  onClick={() => setShowExport(true)}
                  className="btn-secondary flex items-center gap-1 sm:gap-2 py-2 px-3 sm:px-4 text-sm sm:text-base"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Export</span>
                </button>
              )}
              <button
                onClick={() => setShowSettings(true)}
                className="btn-secondary py-2 px-3 min-w-[44px]"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile Optimized */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-6 md:py-8">
        {/* Today Widget - Only show on week view */}
        {viewMode === "week" && <TodayWidget />}

        {/* Content based on view mode */}
        {viewMode === "week" ? (
          <WeekCalendar onDayClick={setSelectedDay} />
        ) : viewMode === "agenda" ? (
          <div className="card">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {currentWorkspace?.name} Agenda
              </h2>
            </div>
            <AgendaView onSlotClick={setSelectedDay} />
          </div>
        ) : viewMode === "my-agenda" ? (
          <MyAgendaView
            onSlotClick={(slot, workspace) => {
              // Switch to workspace and open day view
              setCurrentWorkspace(workspace);
              setSelectedDay(new Date(slot.date + "T00:00:00"));
            }}
          />
        ) : (
          <TeamDashboard
            onSlotClick={(slot, workspace) => {
              // Switch to workspace and open day view
              setCurrentWorkspace(workspace);
              setSelectedDay(new Date(slot.date + "T00:00:00"));
            }}
          />
        )}
      </main>

      {/* Modals */}
      {selectedDay && (
        <DayView date={selectedDay} onClose={() => setSelectedDay(null)} />
      )}
      {showExport && <Export onClose={() => setShowExport(false)} />}
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      {showNotifications && (
        <NotificationsPanel onClose={() => setShowNotifications(false)} />
      )}
      {showTeamPanel && <TeamPanel onClose={() => setShowTeamPanel(false)} />}
      {showWorkspaceSwitcher && (
        <WorkspaceQuickSwitcher
          onClose={() => setShowWorkspaceSwitcher(false)}
        />
      )}
    </div>
  );
}
