import { format } from "date-fns";
import { useState } from "react";
import { updateTimeSlot as updateSlotFirestore } from "../services/firestoreService";
import { useStore } from "../store";
import type { TimeSlot, Workspace } from "../types";
import { isSameDayAs } from "../utils/dateUtils";
import {
  canCheckIn,
  canVerify,
  getUserWorkspaceRole,
} from "../utils/permissions";
import { formatStatusText, getStatusBadgeClasses } from "../utils/slotUtils";
import { getUserName } from "../utils/userUtils";
import { getWorkspaceColorClasses } from "../utils/workspaceUtils";
import MobileActionSheet from "./MobileActionSheet";
import MobileStatusModal from "./MobileStatusModal";
import StatusContextMenu from "./StatusContextMenu";

interface MyAgendaViewProps {
  onSlotClick: (slot: TimeSlot, workspace: Workspace) => void;
}

export default function MyAgendaView({ onSlotClick }: MyAgendaViewProps) {
  const {
    user,
    allUserTimeSlots,
    workspaces,
    users,
    detectedConflicts,
    workspaceMembers,
  } = useStore();

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    slot: TimeSlot | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    slot: null,
  });

  // Mobile action sheet state
  const [mobileActionSheet, setMobileActionSheet] = useState<{
    isOpen: boolean;
    slot: TimeSlot | null;
  }>({
    isOpen: false,
    slot: null,
  });

  // Mobile status modal state
  const [mobileStatusModal, setMobileStatusModal] = useState<{
    isOpen: boolean;
    slot: TimeSlot | null;
  }>({
    isOpen: false,
    slot: null,
  });

  const [dateFilter, setDateFilter] = useState<"today" | "week" | "all">(
    "week"
  );
  const [roleFilter, setRoleFilter] = useState<
    "all" | "participant" | "verifier"
  >("all");

  // Filter slots
  const filteredSlots = allUserTimeSlots.filter((slot) => {
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

    // Role filter
    if (
      roleFilter === "participant" &&
      !slot.participantIds.includes(user?.id || "")
    ) {
      return false;
    }
    if (roleFilter === "verifier" && slot.verifierId !== user?.id) {
      return false;
    }

    return true;
  });

  // Sort by date and time
  const sortedSlots = [...filteredSlots].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.startTime.localeCompare(b.startTime);
  });

  // Group by date
  const groupedSlots = sortedSlots.reduce((acc, slot) => {
    if (!acc[slot.date]) {
      acc[slot.date] = [];
    }
    acc[slot.date].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);

  const isConflicting = (slotId: string): boolean => {
    return detectedConflicts.some(
      (c) => c.slot1Id === slotId || c.slot2Id === slotId
    );
  };

  const getWorkspace = (workspaceId: string) => {
    return workspaces.find((w) => w.id === workspaceId);
  };

  const getUserRole = (slot: TimeSlot): string => {
    if (slot.participantIds.includes(user?.id || "")) return "participant";
    if (slot.verifierId === user?.id) return "verifier";
    return "viewer";
  };

  const handleQuickCheckIn = async (slot: TimeSlot, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!canCheckIn(user, slot)) {
      alert("You don't have permission to check in to this slot.");
      return;
    }

    try {
      const updates = {
        status: "checked-in" as const,
        checkedInAt: Date.now(),
      };
      await updateSlotFirestore(slot.id, updates);
    } catch (error) {
      console.error("Error checking in:", error);
      alert("Failed to check in. Please try again.");
    }
  };

  const handleQuickVerify = async (slot: TimeSlot, e: React.MouseEvent) => {
    e.stopPropagation();

    const workspace = getWorkspace(slot.workspaceId);
    const userRole =
      workspace && user
        ? getUserWorkspaceRole(user.id, workspace.id, workspaceMembers)
        : "participant";

    if (!canVerify(user, slot, userRole)) {
      alert("You don't have permission to verify this slot.");
      return;
    }

    try {
      const updates = {
        status: "confirmed" as const,
        confirmedAt: Date.now(),
      };
      await updateSlotFirestore(slot.id, updates);
    } catch (error) {
      console.error("Error confirming:", error);
      alert("Failed to confirm attendance. Please try again.");
    }
  };

  const handleQuickUndoCheckIn = async (slot: TimeSlot) => {
    console.log("handleQuickUndoCheckIn called for slot:", slot.id, "status:", slot.status);
    console.log("User can check in:", canCheckIn(user, slot));
    
    if (!canCheckIn(user, slot)) {
      alert("You don't have permission to undo check-in for this slot.");
      return;
    }

    try {
      const updates = {
        status: "planned" as const,
        checkedInAt: undefined,
      };
      console.log("Updating slot with:", updates);
      await updateSlotFirestore(slot.id, updates);
      console.log("Successfully updated slot");
    } catch (error) {
      console.error("Error undoing check-in:", error);
      alert("Failed to undo check-in. Please try again.");
    }
  };

  // Context menu handlers
  const handleSlotLongPress = (e: React.MouseEvent, slot: TimeSlot) => {
    e.preventDefault();
    e.stopPropagation();

    if (!canCheckIn(user, slot)) return;

    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      slot,
    });
  };

  const handleStatusChange = async (
    status: "sick" | "away",
    reason: string,
    duration: string
  ) => {
    if (!contextMenu.slot) return;

    try {
      const updates = {
        status: status,
        sickAwayReason: reason,
        sickAwayDuration: duration,
        sickAwayAt: Date.now(),
      };
      await updateSlotFirestore(contextMenu.slot.id, updates);
      console.log(`✅ Marked slot as ${status}: ${reason}`);
    } catch (error) {
      console.error("Error updating slot status:", error);
      alert("Failed to update status. Please try again.");
    }
  };

  const closeContextMenu = () => {
    setContextMenu({
      isOpen: false,
      position: { x: 0, y: 0 },
      slot: null,
    });
  };

  // Mobile action sheet handlers
  const handleSlotPress = (slot: TimeSlot) => {
    setMobileActionSheet({
      isOpen: true,
      slot,
    });
  };

  const closeMobileActionSheet = () => {
    setMobileActionSheet({
      isOpen: false,
      slot: null,
    });
  };

  const handleMarkSickAway = (slot: TimeSlot) => {
    setMobileStatusModal({
      isOpen: true,
      slot,
    });
  };

  const closeMobileStatusModal = () => {
    setMobileStatusModal({
      isOpen: false,
      slot: null,
    });
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-3xl">✨</span>
            My Agenda
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            All your commitments across {workspaces.length} workspace
            {workspaces.length !== 1 ? "s" : ""}
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
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="input-field py-2 px-3 text-sm flex-1 sm:flex-initial"
          >
            <option value="all">All Roles</option>
            <option value="participant">👤 Participant</option>
            <option value="verifier">🔒 Verifier</option>
          </select>
        </div>
      </div>

      {/* Conflict Alert */}
      {detectedConflicts.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl flex-shrink-0">⚠️</span>
            <div className="flex-1">
              <h3 className="font-bold text-red-700">
                {detectedConflicts.length} Scheduling Conflict
                {detectedConflicts.length !== 1 ? "s" : ""}
              </h3>
              <p className="text-sm text-red-600 mt-1">
                You have overlapping time slots across different workspaces
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Agenda List */}
      <div className="space-y-6">
        {Object.entries(groupedSlots).map(([date, slots]) => {
          const dayDate = new Date(date + "T00:00:00");
          const isToday = isSameDayAs(dayDate, new Date());

          return (
            <div key={date}>
              {/* Date Header */}
              <div
                className={`
                  sticky-mobile top-14 sm:top-16 z-10 
                  px-4 py-2 rounded-lg mb-3
                  ${
                    isToday
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-900"
                  }
                `}
              >
                <div className="font-bold text-sm">
                  {format(dayDate, "EEEE, MMMM d")}
                </div>
                <div className="text-xs opacity-80">
                  {slots.length} event{slots.length !== 1 ? "s" : ""}
                </div>
              </div>

              {/* Slots */}
              <div className="space-y-3">
                {slots.map((slot) => {
                  const workspace = getWorkspace(slot.workspaceId);
                  const userRole = getUserRole(slot);
                  const hasConflict = isConflicting(slot.id);
                  const workspaceColor = getWorkspaceColorClasses(
                    workspace?.color
                  );

                  return (
                    <div
                      key={slot.id}
                      className={`
                        rounded-xl border-l-4 p-4 transition-all
                        ${
                          hasConflict
                            ? "border-red-500 bg-red-50"
                            : `${workspaceColor.border} bg-white`
                        }
                        hover:shadow-md cursor-pointer
                      `}
                      onClick={() => workspace && onSlotClick(slot, workspace)}
                      onContextMenu={(e) => handleSlotLongPress(e, slot)}
                    >
                      {/* Workspace Badge & Role */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium border ${workspaceColor.badge}`}
                        >
                          🏢 {workspace?.name || "Unknown"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {userRole === "participant"
                            ? "👤 Participant"
                            : "🔒 Verifier"}
                        </span>
                        {hasConflict && (
                          <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-bold border border-red-300">
                            ⚠️ Conflict
                          </span>
                        )}
                      </div>

                      {/* Slot Info */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-primary text-base">
                              {slot.startTime}
                            </span>
                            <span className="text-gray-400">—</span>
                            <span className="text-sm text-gray-600">
                              {slot.endTime}
                            </span>
                          </div>
                          <h3 className="font-semibold text-lg text-gray-900">
                            {slot.title}
                          </h3>
                          {slot.notes && (
                            <p className="text-sm text-gray-600 mt-1">
                              {slot.notes}
                            </p>
                          )}
                        </div>

                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getStatusBadgeClasses(
                            slot.status
                          )}`}
                        >
                          {formatStatusText(slot.status)}
                        </span>
                      </div>

                      {/* Participants Info */}
                      <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <span>👤</span>
                          <span>{slot.participantIds.length} attending</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>🔒</span>
                          <span>{getUserName(slot.verifierId, users)}</span>
                        </div>
                      </div>

                      {/* Mobile-First Actions */}
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSlotPress(slot);
                          }}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:from-blue-700 active:to-blue-800 text-white font-bold py-3 px-4 rounded-xl transition-all touch-manipulation shadow-lg hover:shadow-xl"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-lg">⚡</span>
                            <span>Actions</span>
                          </div>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            workspace && onSlotClick(slot, workspace);
                          }}
                          className="bg-gray-500 hover:bg-gray-600 active:bg-gray-700 text-white font-bold py-3 px-4 rounded-xl transition-all touch-manipulation shadow-lg hover:shadow-xl"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-lg">👁️</span>
                            <span>View</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {sortedSlots.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No events scheduled
            </h3>
            <p className="text-gray-600">
              {dateFilter === "today"
                ? "You have a free day across all workspaces!"
                : dateFilter === "week"
                ? "No events this week across your workspaces"
                : "No upcoming events in your workspaces"}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {workspaces.length === 0
                ? "Create or join a workspace to get started"
                : "Switch to a workspace to create time slots"}
            </p>
          </div>
        )}
      </div>

      {/* Status Context Menu */}
      {contextMenu.isOpen && contextMenu.slot && (
        <StatusContextMenu
          slot={contextMenu.slot}
          isOpen={contextMenu.isOpen}
          position={contextMenu.position}
          onClose={closeContextMenu}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Mobile Action Sheet */}
      <MobileActionSheet
        slot={mobileActionSheet.slot}
        isOpen={mobileActionSheet.isOpen}
        onClose={closeMobileActionSheet}
        onCheckIn={handleQuickCheckIn}
        onUndoCheckIn={handleQuickUndoCheckIn}
        onConfirm={handleQuickVerify}
        onUndoConfirm={() => {}} // Not implemented in MyAgendaView
        onEdit={() => {}} // Not implemented in MyAgendaView
        onDelete={() => {}} // Not implemented in MyAgendaView
        onMarkSickAway={handleMarkSickAway}
        user={user}
        userRole={userRole}
        workspaceMembers={workspaceMembers}
      />

      {/* Mobile Status Modal */}
      <MobileStatusModal
        slot={mobileStatusModal.slot}
        isOpen={mobileStatusModal.isOpen}
        onClose={closeMobileStatusModal}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
