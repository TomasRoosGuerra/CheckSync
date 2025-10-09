import { create } from "zustand";
import type { TimeSlot, User, UserRole, Workspace, WorkspaceMember, Notification } from "./types";

interface AppStore {
  user: User | null;
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  workspaceMembers: WorkspaceMember[];
  timeSlots: TimeSlot[];
  users: User[];
  notifications: Notification[];
  selectedDate: Date;
  setUser: (user: User | null) => void;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setWorkspaceMembers: (members: WorkspaceMember[]) => void;
  setTimeSlots: (slots: TimeSlot[]) => void;
  addTimeSlot: (slot: TimeSlot) => void;
  updateTimeSlot: (id: string, updates: Partial<TimeSlot>) => void;
  deleteTimeSlot: (id: string) => void;
  setUsers: (users: User[]) => void;
  setNotifications: (notifications: Notification[]) => void;
  setSelectedDate: (date: Date) => void;
  getUserRole: (userId: string) => UserRole;
}

export const useStore = create<AppStore>((set, get) => ({
  user: null,
  currentWorkspace: null,
  workspaces: [],
  workspaceMembers: [],
  timeSlots: [],
  users: [],
  notifications: [],
  selectedDate: new Date(),
  setUser: (user) => set({ user }),
  setCurrentWorkspace: (currentWorkspace) => set({ currentWorkspace }),
  setWorkspaces: (workspaces) => set({ workspaces }),
  setWorkspaceMembers: (workspaceMembers) => set({ workspaceMembers }),
  setTimeSlots: (timeSlots) => set({ timeSlots }),
  addTimeSlot: (slot) =>
    set((state) => ({ timeSlots: [...state.timeSlots, slot] })),
  updateTimeSlot: (id, updates) =>
    set((state) => ({
      timeSlots: state.timeSlots.map((slot) =>
        slot.id === id ? { ...slot, ...updates, updatedAt: Date.now() } : slot
      ),
    })),
  deleteTimeSlot: (id) =>
    set((state) => ({
      timeSlots: state.timeSlots.filter((slot) => slot.id !== id),
    })),
  setUsers: (users) => set({ users }),
  setNotifications: (notifications) => set({ notifications }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  getUserRole: (userId: string) => {
    const state = get();
    const member = state.workspaceMembers.find(
      (m) => m.userId === userId && m.workspaceId === state.currentWorkspace?.id
    );
    return member?.role || "participant";
  },
}));
