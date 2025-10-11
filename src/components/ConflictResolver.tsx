import type { TimeConflict } from "../types";
import { useStore } from "../store";

interface ConflictResolverProps {
  conflict: TimeConflict;
  onClose: () => void;
}

export default function ConflictResolver({
  conflict,
  onClose,
}: ConflictResolverProps) {
  const { allUserTimeSlots, workspaces, setCurrentWorkspace, setViewMode } = useStore();

  const slot1 = allUserTimeSlots.find((s) => s.id === conflict.slot1Id);
  const slot2 = allUserTimeSlots.find((s) => s.id === conflict.slot2Id);
  const workspace1 = workspaces.find((w) => w.id === conflict.workspace1Id);
  const workspace2 = workspaces.find((w) => w.id === conflict.workspace2Id);

  const handleGoToWorkspace = (workspaceId: string) => {
    const workspace = workspaces.find((w) => w.id === workspaceId);
    if (workspace) {
      setCurrentWorkspace(workspace);
      setViewMode("week");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <span className="text-4xl">⚠️</span>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">
              Scheduling Conflict
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {conflict.overlapMinutes}-minute overlap on{" "}
              {new Date(conflict.date).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            ✕
          </button>
        </div>

        {/* Slot 1 */}
        <div className="mb-3 p-4 rounded-lg border-2 border-red-200 bg-red-50">
          <div className="text-xs text-red-600 font-medium mb-1">
            🏢 {workspace1?.name}
          </div>
          <div className="font-semibold text-gray-900">{slot1?.title}</div>
          <div className="text-sm text-gray-600 mt-1">
            {slot1?.startTime} — {slot1?.endTime}
          </div>
        </div>

        {/* Overlap Indicator */}
        <div className="text-center my-3">
          <div className="text-xs text-red-600 font-bold">
            ⚠️ Overlaps {conflict.overlapMinutes} minutes
          </div>
          <div className="text-xs text-gray-500">
            {conflict.overlapStart} — {conflict.overlapEnd}
          </div>
        </div>

        {/* Slot 2 */}
        <div className="mb-4 p-4 rounded-lg border-2 border-red-200 bg-red-50">
          <div className="text-xs text-red-600 font-medium mb-1">
            🏢 {workspace2?.name}
          </div>
          <div className="font-semibold text-gray-900">{slot2?.title}</div>
          <div className="text-sm text-gray-600 mt-1">
            {slot2?.startTime} — {slot2?.endTime}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={() => handleGoToWorkspace(conflict.workspace1Id)}
            className="btn-primary w-full text-sm"
          >
            Reschedule in {workspace1?.name}
          </button>
          <button
            onClick={() => handleGoToWorkspace(conflict.workspace2Id)}
            className="btn-primary w-full text-sm"
          >
            Reschedule in {workspace2?.name}
          </button>
          <button onClick={onClose} className="btn-secondary w-full text-sm">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

