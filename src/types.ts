export type UserRole = "participant" | "verifier" | "both";

export type SlotStatus = "planned" | "checked-in" | "confirmed" | "missed";

export interface User {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
  role: UserRole;
  timeZone: string;
}

export interface TimeSlot {
  id: string;
  title: string;
  date: string; // ISO date string
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  participantIds: string[];
  verifierId: string;
  status: SlotStatus;
  notes?: string;
  checkedInAt?: number; // timestamp
  confirmedAt?: number; // timestamp
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  recurringGroupId?: string; // ID linking recurring slots together
  isRecurring?: boolean; // Flag for recurring slots
}

export interface AttendanceRecord {
  slotId: string;
  participantId: string;
  verifierId: string;
  checkInTime?: number;
  confirmationTime?: number;
  status: SlotStatus;
}

export interface ExportFilter {
  startDate: string;
  endDate: string;
  participantIds?: string[];
  confirmedOnly?: boolean;
}
