import { format } from "date-fns";
import { useState } from "react";
import { useStore } from "../store";
import type { TimeSlot, Workspace } from "../types";
import { isSameDayAs } from "../utils/dateUtils";
import { formatStatusText, getStatusBadgeClasses } from "../utils/slotUtils";
import { getUserName } from "../utils/userUtils";
import { getWorkspaceColorClasses } from "../utils/workspaceUtils";
import { getUserWorkspaceRole, isWorkspaceOwner } from "../utils/permissions";

interface TeamDashboardProps {
  onSlotClick: (slot: TimeSlot, workspace: Workspace) => void;
}

export default function TeamDashboard({ onSlotClick }: TeamDashboardProps) {
  const {
    user,
    allUserTimeSlots,
    workspaces,
    users,
    workspaceMembers,
  } = useStore();

  const [dateFilter, setDateFilter] = useState<"today" | "week" | "all">("week");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("all");

  // Check if user is manager/admin in at least one workspace
  const managedWorkspaces = workspaces.filter((ws) => {
    const role = getUserWorkspaceRole(user?.id || "", ws.id, workspaceMembers);
    return role === "manager" || role === "admin" || isWorkspaceOwner(user, ws);
  });

  if (managedWorkspaces.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Manager Access Required
          </h3>
          <p className="text-gray-600">
            Team Dashboard is only available for workspaces where you are a
            Manager or Admin.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            You currently don't manage any workspaces.
          </p>
        </div>
      </div>
    );
  }

  // Filter to workspaces where user is manager/admin
  const workspaceFilter =
    selectedWorkspaceId === "all"
      ? managedWorkspaces.map((w) => w.id)
      : [selectedWorkspaceId];

  // Get ALL slots from selected managed workspaces (not just user's slots)
  const filteredSlots = allUserTimeSlots.filter((slot) => {
    // Workspace filter
    if (!workspaceFilter.includes(slot.workspaceId)) return false;

    // Date filter
    if (dateFilter === "today") {
      if (!isSameDayAs(new Date(), slot.date)) return false;
    } else if (dateFilter === "week") {
      const slotDate = new Date(slot.date);
      const now = new Date();
      const weekFromNow = new Date();
      weekFromNow.setDate(now.getDate() + 7);
      if (slotDate < now || slotDate > weekFromNow) return false;
    } else {
      // "all" - show only future events
      const slotDate = new Date(slot.date);
      if (slotDate < new Date()) return false;
    }

    return true;
  });

  // Sort by date and time
  const sortedSlots = [...filteredSlots].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.startTime.localeCompare(b.startTime);
  });

  // Group by workspace, then by date
  const groupedByWorkspace = sortedSlots.reduce((acc, slot) => {
    const wsId = slot.workspaceId;
    if (!acc[wsId]) {
      acc[wsId] = {};
    }
    if (!acc[wsId][slot.date]) {
      acc[wsId][slot.date] = [];
    }
    acc[wsId][slot.date].push(slot);
    return acc;
  }, {} as Record<string, Record<string, TimeSlot[]>>);

  const getWorkspace = (workspaceId: string) => {
    return workspaces.find((w) => w.id === workspaceId);
  };

  // Calculate stats
  const totalSlots = sortedSlots.length;
  const confirmedSlots = sortedSlots.filter((s) => s.status === "confirmed")
    .length;
  const checkedInSlots = sortedSlots.filter((s) => s.status === "checked-in")
    .length;
  const plannedSlots = sortedSlots.filter((s) => s.status === "planned").length;

  return (
    <div className="card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-3xl">📊</span>
            Team Dashboard
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage activity across {managedWorkspaces.length} workspace
            {managedWorkspaces.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 w-full sm:w-auto flex-wrap">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="input-field py-2 px-3 text-sm flex-1 sm:flex-initial"
          >
            <option value="today">📅 Today</option>
            <option value="week">📅 This Week</option>
            <option value="all">📅 All Upcoming</option>
          </select>

          <select
            value={selectedWorkspaceId}
            onChange={(e) => setSelectedWorkspaceId(e.target.value)}
            className="input-field py-2 px-3 text-sm flex-1 sm:flex-initial"
          >
            <option value="all">All Workspaces ({managedWorkspaces.length})</option>
            {managedWorkspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-700">{totalSlots}</div>
          <div className="text-xs text-blue-600 mt-1">Total Events</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-700">
            {confirmedSlots}
          </div>
          <div className="text-xs text-green-600 mt-1">Confirmed</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-700">
            {checkedInSlots}
          </div>
          <div className="text-xs text-yellow-600 mt-1">Pending</div>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-700">{plannedSlots}</div>
          <div className="text-xs text-gray-600 mt-1">Planned</div>
        </div>
      </div>

      {/* Team Activity List */}
      <div className="space-y-6">
        {Object.entries(groupedByWorkspace).map(([workspaceId, dateGroups]) => {
          const workspace = getWorkspace(workspaceId);
          const workspaceColor = getWorkspaceColorClasses(workspace?.color);

          return (
            <div key={workspaceId}>
              {/* Workspace Header */}
              <div
                className={`sticky-mobile top-14 sm:top-16 z-10 px-4 py-3 rounded-lg mb-3 ${workspaceColor.bgMedium}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🏢</span>
                    <div>
                      <div className={`font-bold ${workspaceColor.text}`}>
                        {workspace?.name}
                      </div>
                      <div className="text-xs opacity-80">
                        {Object.values(dateGroups).flat().length} event
                        {Object.values(dateGroups).flat().length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                  {isWorkspaceOwner(user, workspace || null) && (
                    <span className="text-xl">👑</span>
                  )}
                </div>
              </div>

              {/* Dates within workspace */}
              {Object.entries(dateGroups).map(([date, slots]) => {
                const dayDate = new Date(date + "T00:00:00");
                const isToday = isSameDayAs(dayDate, new Date());

                return (
                  <div key={date} className="ml-4 mb-4">
                    {/* Date Subheader */}
                    <div
                      className={`px-3 py-1 rounded-md mb-2 text-sm font-semibold inline-block ${
                        isToday
                          ? "bg-primary/10 text-primary"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {format(dayDate, "EEEE, MMM d")}
                    </div>

                    {/* Slots */}
                    <div className="space-y-2">
                      {slots.map((slot) => {
                        return (
                          <div
                            key={slot.id}
                            className="rounded-lg border-2 border-gray-200 p-3 bg-white hover:shadow-md transition-all cursor-pointer"
                            onClick={() => workspace && onSlotClick(slot, workspace)}
                          >
                            {/* Slot Header */}
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-primary text-sm">
                                    {slot.startTime}
                                  </span>
                                  <span className="text-gray-400">—</span>
                                  <span className="text-xs text-gray-600">
                                    {slot.endTime}
                                  </span>
                                </div>
                                <h3 className="font-semibold text-base text-gray-900">
                                  {slot.title}
                                </h3>
                              </div>

                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getStatusBadgeClasses(
                                  slot.status
                                )}`}
                              >
                                {formatStatusText(slot.status)}
                              </span>
                            </div>

                            {/* Participants & Verifier */}
                            <div className="flex items-center gap-4 text-xs text-gray-600">
                              <div className="flex items-center gap-1">
                                <span>👤</span>
                                <span>
                                  {slot.participantIds.length} participant
                                  {slot.participantIds.length !== 1 ? "s" : ""}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span>🔒</span>
                                <span>{getUserName(slot.verifierId, users)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span>👤</span>
                                <span className="text-gray-500 truncate max-w-[150px]">
                                  {slot.participantIds
                                    .slice(0, 2)
                                    .map((id) => getUserName(id, users))
                                    .join(", ")}
                                  {slot.participantIds.length > 2 &&
                                    ` +${slot.participantIds.length - 2}`}
                                </span>
                              </div>
                            </div>

                            {/* Notes */}
                            {slot.notes && (
                              <p className="text-xs text-gray-500 mt-2 italic">
                                📝 {slot.notes}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Empty State */}
        {sortedSlots.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No team activity
            </h3>
            <p className="text-gray-600">
              {dateFilter === "today"
                ? "No events scheduled for your teams today"
                : dateFilter === "week"
                ? "No events this week in your managed workspaces"
                : "No upcoming events in your managed workspaces"}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Create time slots in your workspaces to see activity here
            </p>
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">
              Team Dashboard vs My Agenda
            </h4>
            <p className="text-sm text-gray-600">
              <strong>Team Dashboard</strong> shows ALL events in workspaces you
              manage (including events you're not in).
            </p>
            <p className="text-sm text-gray-600 mt-1">
              <strong>My Agenda</strong> shows only YOUR personal commitments
              across all workspaces.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

