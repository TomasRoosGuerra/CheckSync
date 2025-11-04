import type { TimeSlot } from "../types";
import {
  canCheckIn,
  canDeleteSlot,
  canEditSlot,
  canVerify,
} from "../utils/permissions";

interface MobileActionSheetProps {
  slot: TimeSlot | null;
  isOpen: boolean;
  onClose: () => void;
  onCheckIn: (slot: TimeSlot) => void;
  onUndoCheckIn: (slot: TimeSlot) => void;
  onConfirm: (slot: TimeSlot) => void;
  onUndoConfirm: (slot: TimeSlot) => void;
  onEdit: (slot: TimeSlot) => void;
  onDelete: (slot: TimeSlot) => void;
  onMarkSickAway: (slot: TimeSlot) => void;
  user: any;
  userRole?: string;
  workspaceMembers?: any[];
}

export default function MobileActionSheet({
  slot,
  isOpen,
  onClose,
  onCheckIn,
  onUndoCheckIn,
  onConfirm,
  onUndoConfirm,
  onEdit,
  onDelete,
  onMarkSickAway,
  user,
  userRole,
  workspaceMembers = [],
}: MobileActionSheetProps) {
  if (!isOpen || !slot) return null;

  const actions = [];

  // Debug logging
  console.log("MobileActionSheet - Slot status:", slot.status);
  console.log("MobileActionSheet - User can check in:", canCheckIn(user, slot));

  // Check In / Undo Check In
  if (slot.status === "planned") {
    if (canCheckIn(user, slot)) {
      actions.push({
        id: "checkin",
        icon: "✅",
        title: "Check In",
        subtitle: "Mark yourself as present",
        action: () => onCheckIn(slot),
        color: "bg-yellow-500",
      });
    }
  } else if (slot.status === "checked-in") {
    actions.push({
      id: "undo-checkin",
      icon: "↩️",
      title: "Undo Check In",
      subtitle: "Return to planned status",
      action: () => onUndoCheckIn(slot),
      color: "bg-yellow-500",
    });
  }

  // Confirm / Undo Confirm
  if (canVerify(user, slot, userRole)) {
    if (slot.status === "checked-in") {
      actions.push({
        id: "confirm",
        icon: "🔒",
        title: "Confirm Attendance",
        subtitle: "Mark as confirmed",
        action: () => onConfirm(slot),
        color: "bg-green-500",
      });
    } else if (slot.status === "confirmed") {
      actions.push({
        id: "undo-confirm",
        icon: "↩️",
        title: "Undo Confirmation",
        subtitle: "Return to checked-in status",
        action: () => onUndoConfirm(slot),
        color: "bg-green-500",
      });
    }
  }

  // Mark Sick/Away (for planned or checked-in slots)
  if (
    canCheckIn(user, slot) &&
    (slot.status === "planned" || slot.status === "checked-in")
  ) {
    actions.push({
      id: "sick-away",
      icon: "🏥",
      title: "Mark Sick/Away",
      subtitle: "Mark as unavailable",
      action: () => onMarkSickAway(slot),
      color: "bg-orange-500",
    });
  }

  // Edit
  if (canEditSlot(user, slot, userRole)) {
    actions.push({
      id: "edit",
      icon: "✏️",
      title: "Edit Slot",
      subtitle: "Modify details",
      action: () => onEdit(slot),
      color: "bg-blue-500",
    });
  }

  // Delete
  if (canDeleteSlot(user, slot, userRole)) {
    actions.push({
      id: "delete",
      icon: "🗑️",
      title: "Delete Slot",
      subtitle: "Remove this slot",
      action: () => onDelete(slot),
      color: "bg-red-500",
    });
  }

  // Debug logging
  console.log(
    "MobileActionSheet - Generated actions:",
    actions.map((a) => a.id)
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-700 to-gray-900 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Slot Actions</h2>
              <p className="text-gray-200 mt-1 text-sm">
                {slot.title} - {slot.startTime}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 flex items-center justify-center transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
              aria-label="Close actions"
            >
              <span className="text-xl">✕</span>
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          <div className="space-y-3">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => {
                  action.action();
                  onClose();
                }}
                className={`w-full p-4 rounded-2xl ${action.color} text-gray-900 hover:opacity-90 active:opacity-80 transition-opacity touch-manipulation`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{action.icon}</span>
                  <div className="text-left">
                    <div className="font-bold text-lg">{action.title}</div>
                    <div className="text-sm opacity-90">{action.subtitle}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {actions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">🔒</div>
              <p>No actions available for this slot</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
