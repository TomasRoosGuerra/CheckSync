import { useState } from "react";
import { useStore } from "../store";
import { canExportData, getUserWorkspaceRole } from "../utils/permissions";
import AgendaView from "./AgendaView";
import DayView from "./DayView";
import Export from "./Export";
import Settings from "./Settings";
import WeekCalendar from "./WeekCalendar";

type ViewMode = "week" | "agenda";

export default function Dashboard() {
  const { user, currentWorkspace, workspaceMembers } = useStore();
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("week");

  // Get user's role in current workspace
  const userRole = user && currentWorkspace 
    ? getUserWorkspaceRole(user.id, currentWorkspace.id, workspaceMembers)
    : "participant";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Mobile Optimized */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm sm:text-lg">
                  ✓
                </span>
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-gray-900">
                  {currentWorkspace?.name || "CheckSync"}
                </h1>
                <p className="text-xs text-gray-600">
                  {user?.name} · <span className="capitalize">{userRole}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {/* View Toggle - Mobile */}
              <button
                onClick={() =>
                  setViewMode(viewMode === "week" ? "agenda" : "week")
                }
                className="sm:hidden btn-secondary py-2 px-3 text-xs font-medium touch-manipulation"
                title={
                  viewMode === "week" ? "Switch to Agenda" : "Switch to Week"
                }
              >
                {viewMode === "week" ? "📋" : "📅"}
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
        {viewMode === "week" ? (
          <WeekCalendar onDayClick={setSelectedDay} />
        ) : (
          <div className="card">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Agenda View</h2>
              <button
                onClick={() => setViewMode("week")}
                className="text-primary text-sm font-medium hover:underline"
              >
                ← Back to Week
              </button>
            </div>
            <AgendaView onSlotClick={setSelectedDay} />
          </div>
        )}
      </main>

      {/* Modals */}
      {selectedDay && (
        <DayView date={selectedDay} onClose={() => setSelectedDay(null)} />
      )}
      {showExport && <Export onClose={() => setShowExport(false)} />}
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </div>
  );
}
