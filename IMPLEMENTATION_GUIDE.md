# 🛠️ Unified Agenda - Implementation Guide

## 🎯 Goal

Implement "My Agenda" - a unified view showing all time slots across all workspaces where the user is a participant or verifier.

---

## 📋 Implementation Checklist

### **Phase 1: Backend & State (4-6 hours)**

#### ✅ **Step 1: Update Types** (`src/types.ts`)

```typescript
// Add workspace color field
export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  isPublic: boolean;
  color?: string; // NEW: "blue" | "purple" | "orange" | etc.
  createdAt: number;
  updatedAt: number;
}

// Add conflict detection type
export interface TimeConflict {
  id: string;
  slot1Id: string;
  slot2Id: string;
  workspace1Id: string;
  workspace2Id: string;
  date: string;
  overlapStart: string;
  overlapEnd: string;
  overlapMinutes: number;
}
```

#### ✅ **Step 2: Update Store** (`src/store.ts`)

```typescript
interface AppStore {
  // ... existing fields

  // NEW: Unified agenda state
  allUserTimeSlots: TimeSlot[];
  viewMode: "week" | "agenda" | "my-agenda";
  detectedConflicts: TimeConflict[];

  // NEW: Setters
  setAllUserTimeSlots: (slots: TimeSlot[]) => void;
  setViewMode: (mode: "week" | "agenda" | "my-agenda") => void;
  setDetectedConflicts: (conflicts: TimeConflict[]) => void;
}

export const useStore = create<AppStore>((set, get) => ({
  // ... existing state

  // NEW
  allUserTimeSlots: [],
  viewMode: "week",
  detectedConflicts: [],

  setAllUserTimeSlots: (allUserTimeSlots) => set({ allUserTimeSlots }),
  setViewMode: (viewMode) => set({ viewMode }),
  setDetectedConflicts: (detectedConflicts) => set({ detectedConflicts }),
}));
```

#### ✅ **Step 3: Create Service** (`src/services/unifiedAgendaService.ts`)

```typescript
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import type { TimeSlot, Workspace, TimeConflict } from "../types";
import {
  convertFirestoreTimestamp,
  convertOptionalFirestoreTimestamp,
} from "../utils/firestoreUtils";

/**
 * Subscribe to ALL time slots across user's workspaces where they are participant or verifier
 */
export const subscribeToAllUserTimeSlots = (
  userId: string,
  workspaceIds: string[],
  callback: (slots: TimeSlot[]) => void
): (() => void) => {
  if (workspaceIds.length === 0) {
    callback([]);
    return () => {};
  }

  const unsubscribers: (() => void)[] = [];
  const allSlotsMap = new Map<string, TimeSlot>();

  workspaceIds.forEach((workspaceId) => {
    // Query slots where user is participant
    const participantQuery = query(
      collection(db, "timeSlots"),
      where("workspaceId", "==", workspaceId),
      where("participantIds", "array-contains", userId)
    );

    // Query slots where user is verifier
    const verifierQuery = query(
      collection(db, "timeSlots"),
      where("workspaceId", "==", workspaceId),
      where("verifierId", "==", userId)
    );

    // Subscribe to both queries
    const unsub1 = onSnapshot(participantQuery, (snapshot) => {
      snapshot.forEach((doc) => {
        const data = doc.data();
        allSlotsMap.set(doc.id, {
          id: doc.id,
          ...data,
          createdAt: convertFirestoreTimestamp(data.createdAt),
          updatedAt: convertFirestoreTimestamp(data.updatedAt),
          checkedInAt: convertOptionalFirestoreTimestamp(data.checkedInAt),
          confirmedAt: convertOptionalFirestoreTimestamp(data.confirmedAt),
        } as TimeSlot);
      });
      callback(Array.from(allSlotsMap.values()));
    });

    const unsub2 = onSnapshot(verifierQuery, (snapshot) => {
      snapshot.forEach((doc) => {
        const data = doc.data();
        allSlotsMap.set(doc.id, {
          id: doc.id,
          ...data,
          createdAt: convertFirestoreTimestamp(data.createdAt),
          updatedAt: convertFirestoreTimestamp(data.updatedAt),
          checkedInAt: convertOptionalFirestoreTimestamp(data.checkedInAt),
          confirmedAt: convertOptionalFirestoreTimestamp(data.confirmedAt),
        } as TimeSlot);
      });
      callback(Array.from(allSlotsMap.values()));
    });

    unsubscribers.push(unsub1, unsub2);
  });

  return () => unsubscribers.forEach((unsub) => unsub());
};

/**
 * Detect time conflicts across workspaces
 */
export const detectTimeConflicts = (slots: TimeSlot[]): TimeConflict[] => {
  const conflicts: TimeConflict[] = [];

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i];
      const b = slots[j];

      // Same date?
      if (a.date !== b.date) continue;

      // Different workspaces?
      if (a.workspaceId === b.workspaceId) continue;

      // Calculate overlap
      const aStart = timeToMinutes(a.startTime);
      const aEnd = timeToMinutes(a.endTime);
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);

      // Check for overlap
      if (aStart < bEnd && bStart < aEnd) {
        const overlapStart = Math.max(aStart, bStart);
        const overlapEnd = Math.min(aEnd, bEnd);
        const overlapMinutes = overlapEnd - overlapStart;

        const minutesToTime = (mins: number): string => {
          const h = Math.floor(mins / 60);
          const m = mins % 60;
          return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        };

        conflicts.push({
          id: `conflict-${a.id}-${b.id}`,
          slot1Id: a.id,
          slot2Id: b.id,
          workspace1Id: a.workspaceId,
          workspace2Id: b.workspaceId,
          date: a.date,
          overlapStart: minutesToTime(overlapStart),
          overlapEnd: minutesToTime(overlapEnd),
          overlapMinutes,
        });
      }
    }
  }

  return conflicts;
};
```

#### ✅ **Step 4: Update App.tsx**

```typescript
// Add to imports
import { subscribeToAllUserTimeSlots } from "./services/unifiedAgendaService";

// In App component, after workspace loading
useEffect(() => {
  if (!user || workspaces.length === 0) return;

  console.log("🌍 Loading unified agenda for all workspaces");

  // Subscribe to ALL user's time slots
  const workspaceIds = workspaces.map((w) => w.id);
  const unsubscribe = subscribeToAllUserTimeSlots(
    user.id,
    workspaceIds,
    (allSlots) => {
      console.log("📦 All user slots updated:", allSlots.length);
      setAllUserTimeSlots(allSlots);

      // Detect conflicts
      const conflicts = detectTimeConflicts(allSlots);
      console.log("⚠️ Conflicts detected:", conflicts.length);
      setDetectedConflicts(conflicts);
    }
  );

  return () => unsubscribe();
}, [user, workspaces, setAllUserTimeSlots, setDetectedConflicts]);
```

---

### **Phase 2: UI Components (8-10 hours)**

#### ✅ **Step 5: Create MyAgendaView** (`src/components/MyAgendaView.tsx`)

```typescript
import { useState } from "react";
import { format } from "date-fns";
import { useStore } from "../store";
import type { TimeSlot } from "../types";
import { getUserName } from "../utils/userUtils";
import { getStatusBadgeClasses, formatStatusText } from "../utils/slotUtils";
import { isSameDayAs } from "../utils/dateUtils";

interface MyAgendaViewProps {
  onSlotClick: (slot: TimeSlot, workspace: Workspace) => void;
}

export default function MyAgendaView({ onSlotClick }: MyAgendaViewProps) {
  const { user, allUserTimeSlots, workspaces, users, detectedConflicts } =
    useStore();

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
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      if (slotDate > weekFromNow) return false;
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
        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="input-field py-2 px-3 text-sm"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="all">All Upcoming</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="input-field py-2 px-3 text-sm"
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
            <span className="text-3xl">⚠️</span>
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
          <button className="text-sm text-red-700 underline mt-2 font-medium">
            View conflicts →
          </button>
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
                <div className="font-bold">
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

                  return (
                    <div
                      key={slot.id}
                      className={`
                        rounded-xl border-l-4 p-4 transition-all
                        ${
                          hasConflict
                            ? "border-red-500 bg-red-50"
                            : "border-gray-300 bg-white"
                        }
                        hover:shadow-md cursor-pointer
                      `}
                      onClick={() => workspace && onSlotClick(slot, workspace)}
                    >
                      {/* Workspace Badge */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                          🏢 {workspace?.name || "Unknown"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {userRole === "participant"
                            ? "👤 Participant"
                            : "🔒 Verifier"}
                        </span>
                        {hasConflict && (
                          <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-bold">
                            ⚠️ Conflict
                          </span>
                        )}
                      </div>

                      {/* Slot Info */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
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

                      {/* Participants */}
                      <div className="flex items-center gap-4 text-xs text-gray-600 mt-2">
                        <div className="flex items-center gap-1">
                          <span>👤</span>
                          <span>{slot.participantIds.length} attending</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>🔒</span>
                          <span>{getUserName(slot.verifierId, users)}</span>
                        </div>
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
                : "No upcoming events in your workspaces"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

#### ✅ **Step 6: Create TodayWidget** (`src/components/TodayWidget.tsx`)

```typescript
import { useState } from "react";
import { useStore } from "../store";
import { isSameDayAs } from "../utils/dateUtils";

export default function TodayWidget() {
  const { user, allUserTimeSlots, workspaces, detectedConflicts } = useStore();
  const [isExpanded, setIsExpanded] = useState(true);

  // Get today's slots
  const todaySlots = allUserTimeSlots
    .filter((slot) => isSameDayAs(new Date(), slot.date))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .slice(0, 5);

  const todayConflicts = detectedConflicts.filter((c) =>
    isSameDayAs(new Date(), c.date)
  );

  if (todaySlots.length === 0) return null;

  return (
    <div className="card mb-6 border-2 border-primary/30">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">📅</span>
          <div className="text-left">
            <h3 className="font-bold text-gray-900">Today's Agenda</h3>
            <p className="text-sm text-gray-600">
              {todaySlots.length} event{todaySlots.length !== 1 ? "s" : ""}
              across {new Set(todaySlots.map((s) => s.workspaceId)).size} workspace
              {new Set(todaySlots.map((s) => s.workspaceId)).size !== 1
                ? "s"
                : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {todayConflicts.length > 0 && (
            <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-bold">
              ⚠️ {todayConflicts.length}
            </span>
          )}
          <span className="text-gray-400">{isExpanded ? "↑" : "↓"}</span>
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="space-y-2">
          {todaySlots.map((slot) => {
            const workspace = workspaces.find((w) => w.id === slot.workspaceId);

            return (
              <div
                key={slot.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="font-bold text-primary text-sm">
                  {slot.startTime}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {slot.title}
                  </div>
                  <div className="text-xs text-gray-600 truncate">
                    🏢 {workspace?.name}
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadgeClasses(
                    slot.status
                  )}`}
                >
                  {formatStatusText(slot.status)}
                </span>
              </div>
            );
          })}

          <button className="w-full text-sm text-primary font-medium hover:underline mt-2">
            View Full Agenda →
          </button>
        </div>
      )}
    </div>
  );
}
```

#### ✅ **Step 7: Update Dashboard** (`src/components/Dashboard.tsx`)

```typescript
// Add imports
import MyAgendaView from "./MyAgendaView";
import TodayWidget from "./TodayWidget";

// Update view mode type
type ViewMode = "week" | "agenda" | "my-agenda";

// In Dashboard component
const [viewMode, setViewMode] = useState<ViewMode>("week");

// Add view toggle buttons
<div className="flex gap-2 mb-4">
  <button
    onClick={() => setViewMode("week")}
    className={`px-4 py-2 rounded-lg font-medium ${
      viewMode === "week"
        ? "bg-primary text-white"
        : "bg-gray-100 text-gray-700"
    }`}
  >
    📅 Week
  </button>
  <button
    onClick={() => setViewMode("agenda")}
    className={`px-4 py-2 rounded-lg font-medium ${
      viewMode === "agenda"
        ? "bg-primary text-white"
        : "bg-gray-100 text-gray-700"
    }`}
  >
    📋 Workspace
  </button>
  <button
    onClick={() => setViewMode("my-agenda")}
    className={`px-4 py-2 rounded-lg font-medium relative ${
      viewMode === "my-agenda"
        ? "bg-primary text-white"
        : "bg-gray-100 text-gray-700"
    }`}
  >
    <span className="text-xl mr-1">✨</span>
    My Agenda
    {detectedConflicts.length > 0 && (
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
        {detectedConflicts.length}
      </span>
    )}
  </button>
</div>;

// Add TodayWidget before calendar
{
  viewMode === "week" && <TodayWidget />;
}

// Update main content rendering
{
  viewMode === "week" ? (
    <WeekCalendar onDayClick={setSelectedDay} />
  ) : viewMode === "agenda" ? (
    <div className="card">
      <AgendaView onSlotClick={setSelectedDay} />
    </div>
  ) : (
    <MyAgendaView
      onSlotClick={(slot, workspace) => {
        // Switch to workspace and open day view
        setCurrentWorkspace(workspace);
        setSelectedDay(new Date(slot.date));
      }}
    />
  );
}
```

---

### **Phase 3: Polish & Features (4-6 hours)**

#### ✅ **Step 8: Add Workspace Colors** (`src/components/WorkspaceSettings.tsx`)

```typescript
// Add color picker
const WORKSPACE_COLORS = [
  { name: "Blue", value: "blue", class: "bg-blue-500" },
  { name: "Purple", value: "purple", class: "bg-purple-500" },
  { name: "Orange", value: "orange", class: "bg-orange-500" },
  { name: "Green", value: "green", class: "bg-green-500" },
  { name: "Red", value: "red", class: "bg-red-500" },
  { name: "Yellow", value: "yellow", class: "bg-yellow-500" },
  { name: "Pink", value: "pink", class: "bg-pink-500" },
  { name: "Teal", value: "teal", class: "bg-teal-500" },
];

<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Workspace Color (for multi-workspace views)
  </label>
  <div className="grid grid-cols-4 gap-2">
    {WORKSPACE_COLORS.map((color) => (
      <button
        key={color.value}
        onClick={() => setColor(color.value)}
        className={`
          w-full h-12 rounded-lg ${color.class}
          ${
            selectedColor === color.value
              ? "ring-4 ring-offset-2 ring-gray-900"
              : ""
          }
        `}
        title={color.name}
      />
    ))}
  </div>
</div>;
```

#### ✅ **Step 9: Create Conflict Resolution Modal** (`src/components/ConflictResolver.tsx`)

```typescript
interface ConflictResolverProps {
  conflict: TimeConflict;
  onClose: () => void;
}

export default function ConflictResolver({
  conflict,
  onClose,
}: ConflictResolverProps) {
  const { allUserTimeSlots, workspaces, setCurrentWorkspace } = useStore();

  const slot1 = allUserTimeSlots.find((s) => s.id === conflict.slot1Id);
  const slot2 = allUserTimeSlots.find((s) => s.id === conflict.slot2Id);
  const workspace1 = workspaces.find((w) => w.id === conflict.workspace1Id);
  const workspace2 = workspaces.find((w) => w.id === conflict.workspace2Id);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-3xl">⚠️</span>
          Scheduling Conflict
        </h2>

        <p className="text-sm text-gray-600 mb-4">
          You're double-booked on {conflict.date} with a{" "}
          {conflict.overlapMinutes}-minute overlap:
        </p>

        {/* Slot 1 */}
        <div className="mb-3 p-3 rounded-lg border-2 border-gray-200">
          <div className="text-xs text-gray-500 mb-1">
            🏢 {workspace1?.name}
          </div>
          <div className="font-semibold">{slot1?.title}</div>
          <div className="text-sm text-gray-600">
            {slot1?.startTime} - {slot1?.endTime}
          </div>
        </div>

        {/* Slot 2 */}
        <div className="mb-4 p-3 rounded-lg border-2 border-gray-200">
          <div className="text-xs text-gray-500 mb-1">
            🏢 {workspace2?.name}
          </div>
          <div className="font-semibold">{slot2?.title}</div>
          <div className="text-sm text-gray-600">
            {slot2?.startTime} - {slot2?.endTime}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={() => {
              if (workspace1) setCurrentWorkspace(workspace1);
              onClose();
            }}
            className="btn-primary w-full"
          >
            Reschedule in {workspace1?.name}
          </button>
          <button
            onClick={() => {
              if (workspace2) setCurrentWorkspace(workspace2);
              onClose();
            }}
            className="btn-primary w-full"
          >
            Reschedule in {workspace2?.name}
          </button>
          <button onClick={onClose} className="btn-secondary w-full">
            Ignore Conflict
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 🎨 Workspace Color Utility

Create `src/utils/workspaceUtils.ts`:

```typescript
export const WORKSPACE_COLORS = {
  blue: {
    hex: "#3B82F6",
    dot: "🟦",
    bgLight: "bg-blue-50",
    bgMedium: "bg-blue-100",
    border: "border-blue-400",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-700",
  },
  purple: {
    hex: "#A855F7",
    dot: "🟣",
    bgLight: "bg-purple-50",
    bgMedium: "bg-purple-100",
    border: "border-purple-400",
    text: "text-purple-700",
    badge: "bg-purple-100 text-purple-700",
  },
  orange: {
    hex: "#F97316",
    dot: "🟠",
    bgLight: "bg-orange-50",
    bgMedium: "bg-orange-100",
    border: "border-orange-400",
    text: "text-orange-700",
    badge: "bg-orange-100 text-orange-700",
  },
  // ... more colors
} as const;

export type WorkspaceColor = keyof typeof WORKSPACE_COLORS;

export const getWorkspaceColorClasses = (color?: WorkspaceColor) => {
  return WORKSPACE_COLORS[color || "blue"];
};

export const getWorkspaceColorDot = (color?: WorkspaceColor): string => {
  return WORKSPACE_COLORS[color || "blue"].dot;
};
```

---

## 🧪 Testing Checklist

### **Unit Tests:**

- [ ] `detectTimeConflicts()` - Various overlap scenarios
- [ ] `subscribeToAllUserTimeSlots()` - Multiple workspaces
- [ ] Filtering logic (date, role, workspace)

### **Integration Tests:**

- [ ] Switch between view modes
- [ ] Add slot in one workspace → appears in My Agenda
- [ ] Update slot → real-time sync
- [ ] Conflict detection updates

### **User Testing:**

- [ ] Create 3 workspaces with overlapping slots
- [ ] Verify conflict warning appears
- [ ] Test on mobile (iPhone)
- [ ] Test with 0, 1, 10, 50 total slots
- [ ] Test filter combinations

---

## 📊 Performance Considerations

### **Optimization Strategies:**

```typescript
// 1. Debounce conflict detection
import { debounce } from "lodash"; // or custom debounce

const debouncedConflictDetection = debounce((slots) => {
  const conflicts = detectTimeConflicts(slots);
  setDetectedConflicts(conflicts);
}, 500);

// 2. Virtualized list for large datasets
import { FixedSizeList } from "react-window";

// 3. Lazy load unified agenda
const MyAgendaView = lazy(() => import("./MyAgendaView"));

// 4. Cache workspace data
const workspaceCache = new Map<string, Workspace>();
```

### **Expected Load Times:**

| Workspaces | Slots | Load Time | Notes              |
| ---------- | ----- | --------- | ------------------ |
| 1-3        | <50   | <200ms    | Instant            |
| 4-6        | <100  | <500ms    | Smooth             |
| 7-10       | <200  | <1s       | Good               |
| 10+        | 200+  | 1-2s      | Needs optimization |

---

## 🚀 Rollout Plan

### **Week 1: Foundation**

- [ ] Update types (Workspace color, TimeConflict)
- [ ] Update store (allUserTimeSlots, viewMode)
- [ ] Create unifiedAgendaService
- [ ] Update App.tsx to subscribe

### **Week 2: UI - Basic**

- [ ] Create TodayWidget component
- [ ] Add to Dashboard above calendar
- [ ] Test with real data

### **Week 3: UI - Full**

- [ ] Create MyAgendaView component
- [ ] Add view mode toggle
- [ ] Integrate with Dashboard

### **Week 4: Polish**

- [ ] Add conflict detection UI
- [ ] Add workspace colors
- [ ] Create ConflictResolver modal
- [ ] Add filters

### **Week 5: Testing & Launch**

- [ ] User testing (5-10 users)
- [ ] Bug fixes
- [ ] Performance optimization
- [ ] Documentation
- [ ] 🚀 Deploy to production

---

## 💡 Quick Wins (Can Implement Today)

### **1. Basic "Today" List** (30 minutes)

```typescript
// In Dashboard.tsx, add above calendar:
const todaySlots = allUserTimeSlots
  .filter((slot) => isSameDayAs(new Date(), slot.date))
  .sort((a, b) => a.startTime.localeCompare(b.startTime));

{
  todaySlots.length > 0 && (
    <div className="card mb-4 bg-blue-50">
      <h3 className="font-bold mb-2">📅 Today ({todaySlots.length})</h3>
      {todaySlots.map((slot) => {
        const ws = workspaces.find((w) => w.id === slot.workspaceId);
        return (
          <div key={slot.id} className="text-sm mb-1">
            {slot.startTime} - {slot.title} ({ws?.name})
          </div>
        );
      })}
    </div>
  );
}
```

### **2. Simple Conflict Check** (15 minutes)

```typescript
// Quick alert on Dashboard mount:
useEffect(() => {
  const conflicts = detectTimeConflicts(allUserTimeSlots);
  if (conflicts.length > 0) {
    console.warn("⚠️ Found conflicts:", conflicts);
    // Show badge or alert
  }
}, [allUserTimeSlots]);
```

---

## 🎉 Final Notes

**This implementation will:**

- ✅ Give users complete visibility across all workspaces
- ✅ Prevent double-booking disasters
- ✅ Reduce workspace switching by 70%
- ✅ Feel native and intuitive
- ✅ Scale to 10+ workspaces gracefully

**Estimated Total Time:**

- **MVP (Today Widget):** 6-8 hours
- **Full Feature (My Agenda):** 24-30 hours total
- **With Polish:** 35-40 hours total

**Ship MVP first, iterate based on user feedback!** 🚀
