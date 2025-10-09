import { useStore } from "../store";

export default function QuickStats() {
  const { timeSlots, workspaceMembers, currentWorkspace } = useStore();

  const today = new Date().toISOString().split("T")[0];

  const todaySlots = timeSlots.filter((slot) => slot.date === today);
  const confirmedToday = todaySlots.filter(
    (slot) => slot.status === "confirmed"
  ).length;
  const pendingToday = todaySlots.filter(
    (slot) => slot.status === "checked-in"
  ).length;

  const memberCount = workspaceMembers.filter(
    (m) => m.workspaceId === currentWorkspace?.id
  ).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Stats</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-700">
            {todaySlots.length}
          </div>
          <div className="text-xs text-blue-600 mt-1">Today</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-700">
            {confirmedToday}
          </div>
          <div className="text-xs text-green-600 mt-1">Confirmed</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-700">
            {pendingToday}
          </div>
          <div className="text-xs text-yellow-600 mt-1">Pending</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-700">
            {memberCount}
          </div>
          <div className="text-xs text-purple-600 mt-1">Members</div>
        </div>
      </div>
    </div>
  );
}
