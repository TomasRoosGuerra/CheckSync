import { create } from "zustand";
import type { TimeSlot, User } from "./types";

interface AppStore {
  user: User | null;
  timeSlots: TimeSlot[];
  users: User[];
  selectedDate: Date;
  setUser: (user: User | null) => void;
  setTimeSlots: (slots: TimeSlot[]) => void;
  addTimeSlot: (slot: TimeSlot) => void;
  updateTimeSlot: (id: string, updates: Partial<TimeSlot>) => void;
  deleteTimeSlot: (id: string) => void;
  setUsers: (users: User[]) => void;
  setSelectedDate: (date: Date) => void;
}

export const useStore = create<AppStore>((set) => ({
  user: null,
  timeSlots: [],
  users: [],
  selectedDate: new Date(),
  setUser: (user) => set({ user }),
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
  setSelectedDate: (selectedDate) => set({ selectedDate }),
}));
