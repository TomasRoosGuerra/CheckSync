import { format, parseISO } from "date-fns";
import type { ExportFilter, TimeSlot, User } from "../types";

export const exportToCSV = (
  slots: TimeSlot[],
  users: User[],
  filter?: ExportFilter
) => {
  let filteredSlots = [...slots];

  // Apply filters
  if (filter) {
    filteredSlots = filteredSlots.filter((slot) => {
      const slotDate = parseISO(slot.date);
      const startDate = parseISO(filter.startDate);
      const endDate = parseISO(filter.endDate);

      const dateMatch = slotDate >= startDate && slotDate <= endDate;
      const participantMatch =
        !filter.participantIds ||
        filter.participantIds.some((id) => slot.participantIds.includes(id));
      const statusMatch = !filter.confirmedOnly || slot.status === "confirmed";

      return dateMatch && participantMatch && statusMatch;
    });
  }

  // Build CSV
  const headers = [
    "Title",
    "Date",
    "Start Time",
    "End Time",
    "Status",
    "Participants",
    "Verifier",
    "Checked In At",
    "Confirmed At",
    "Notes",
  ];

  const rows = filteredSlots.map((slot) => {
    const participants = slot.participantIds
      .map((id) => users.find((u) => u.id === id)?.name || "Unknown")
      .join("; ");
    const verifier =
      users.find((u) => u.id === slot.verifierId)?.name || "Unknown";
    const checkedInTime = slot.checkedInAt
      ? format(new Date(slot.checkedInAt), "yyyy-MM-dd HH:mm:ss")
      : "";
    const confirmedTime = slot.confirmedAt
      ? format(new Date(slot.confirmedAt), "yyyy-MM-dd HH:mm:ss")
      : "";

    return [
      slot.title,
      slot.date,
      slot.startTime,
      slot.endTime,
      slot.status,
      participants,
      verifier,
      checkedInTime,
      confirmedTime,
      slot.notes || "",
    ];
  });

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  // Download file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `CheckSync_Export_${format(new Date(), "yyyy-MM-dd")}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
