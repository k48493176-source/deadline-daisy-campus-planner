export const REMINDER_OPTIONS = [
  { value: "none", label: "No reminder" },
  { value: "1_hour", label: "1 hour before" },
  { value: "1_day", label: "1 day before" },
  { value: "2_days", label: "2 days before" },
] as const;

const OFFSET_MS: Record<string, number> = { "1_hour": 36e5, "1_day": 864e5, "2_days": 2 * 864e5 };

type R = { completed: boolean; due_date: string; reminder_before?: string | null };

/** True when an open task's reminder window has started (includes overdue). */
export function reminderActive(t: R, now = Date.now()) {
  const off = OFFSET_MS[t.reminder_before ?? "none"];
  if (!off || t.completed) return false;
  return new Date(t.due_date).getTime() - now < off;
}

export function activeReminders<T extends R>(tasks: T[], now = Date.now()) {
  return tasks.filter((t) => reminderActive(t, now)).sort((a, b) => a.due_date.localeCompare(b.due_date));
}
