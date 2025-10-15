import type { TimeSlot, User, Workspace } from "../types";

export interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  triggers: NotificationTrigger[];
}

export type NotificationTrigger =
  | "slot_created"
  | "slot_updated"
  | "slot_reminder"
  | "check_in_required"
  | "verification_required"
  | "member_joined"
  | "member_left";

export interface NotificationSettings {
  emailNotifications: boolean;
  reminderHours: number; // Hours before slot to send reminder
  triggers: NotificationTrigger[];
}

export const getDefaultNotificationSettings = (): NotificationSettings => ({
  emailNotifications: true,
  reminderHours: 24, // 24 hours before
  triggers: [
    "slot_created",
    "slot_reminder",
    "check_in_required",
    "member_joined",
  ],
});

export const getNotificationTemplate = (
  trigger: NotificationTrigger,
  context: {
    slot?: TimeSlot;
    workspace?: Workspace;
    member?: User;
  }
): { subject: string; body: string } => {
  const { slot, workspace, member } = context;

  switch (trigger) {
    case "slot_created":
      return {
        subject: `New time slot created in ${workspace?.name}`,
        body: `A new time slot "${slot?.title}" has been created for ${slot?.date} at ${slot?.startTime}. Check your CheckSync app for details.`,
      };

    case "slot_reminder":
      return {
        subject: `Reminder: ${slot?.title} is coming up`,
        body: `Don't forget! You have "${slot?.title}" scheduled for ${slot?.date} at ${slot?.startTime} in ${workspace?.name}.`,
      };

    case "check_in_required":
      return {
        subject: `Check-in required for ${slot?.title}`,
        body: `Please check in for "${slot?.title}" scheduled for ${slot?.date} at ${slot?.startTime} in ${workspace?.name}.`,
      };

    case "verification_required":
      return {
        subject: `Verification needed for ${slot?.title}`,
        body: `Please verify attendance for "${slot?.title}" on ${slot?.date} at ${slot?.startTime} in ${workspace?.name}.`,
      };

    case "member_joined":
      return {
        subject: `New member joined ${workspace?.name}`,
        body: `${member?.name} has joined your workspace "${workspace?.name}". Welcome them to the team!`,
      };

    case "member_left":
      return {
        subject: `${member?.name} left ${workspace?.name}`,
        body: `${member?.name} has left the workspace "${workspace?.name}".`,
      };

    default:
      return {
        subject: "CheckSync Notification",
        body: "You have a new notification from CheckSync.",
      };
  }
};

export const scheduleReminder = (
  slot: TimeSlot,
  reminderHours: number = 24
): Date | null => {
  try {
    const slotDateTime = new Date(`${slot.date}T${slot.startTime}:00`);
    const reminderTime = new Date(
      slotDateTime.getTime() - reminderHours * 60 * 60 * 1000
    );

    // Only schedule if reminder time is in the future
    return reminderTime > new Date() ? reminderTime : null;
  } catch (error) {
    console.error("Error scheduling reminder:", error);
    return null;
  }
};

export const shouldSendReminder = (slot: TimeSlot): boolean => {
  // Simple logic: send reminder if slot is in the next 24 hours and status is still "planned"
  const now = new Date();
  const slotDateTime = new Date(`${slot.date}T${slot.startTime}:00`);
  const hoursUntilSlot =
    (slotDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  return (
    hoursUntilSlot > 0 && hoursUntilSlot <= 24 && slot.status === "planned"
  );
};

// Mock email service - in production, this would integrate with SendGrid, AWS SES, etc.
export const sendEmailNotification = async (
  to: string,
  subject: string,
  body: string
): Promise<boolean> => {
  try {
    // In a real implementation, this would:
    // 1. Validate email address
    // 2. Check user's notification preferences
    // 3. Send via email service provider
    // 4. Log the notification

    console.log(`📧 Email notification sent to ${to}:`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 100));

    return true;
  } catch (error) {
    console.error("Error sending email notification:", error);
    return false;
  }
};
