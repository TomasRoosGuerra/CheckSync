import {
  addDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  getWeek,
  isSameDay,
  parseISO,
  startOfWeek,
  subDays,
} from "date-fns";

export const getWeekDays = (date: Date) => {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
};

export const getExtendedWeekDays = (date: Date) => {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(date, { weekStartsOn: 1 });

  // Add half day before and after for mobile
  const extendedStart = subDays(start, 1); // Add Sunday
  const extendedEnd = addDays(end, 1); // Add next Monday

  return eachDayOfInterval({ start: extendedStart, end: extendedEnd });
};

export const getWeekNumber = (date: Date) => {
  return getWeek(date, { weekStartsOn: 1 });
};

export const formatDate = (date: Date, formatStr: string = "yyyy-MM-dd") => {
  return format(date, formatStr);
};

export const formatTime = (time: string) => {
  return time; // Already in HH:mm format
};

export const isSameDayAs = (date1: Date, date2: Date | string) => {
  const d2 = typeof date2 === "string" ? parseISO(date2) : date2;
  return isSameDay(date1, d2);
};

export const nextWeek = (date: Date) => addDays(date, 7);
export const prevWeek = (date: Date) => subDays(date, 7);

export const getDayName = (date: Date, short: boolean = false) => {
  return format(date, short ? "EEE" : "EEEE");
};

export const getMonthDay = (date: Date) => {
  return format(date, "d");
};
