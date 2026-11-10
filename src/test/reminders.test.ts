import { describe, expect, it } from "vitest";
import { reminderActive } from "@/lib/reminders";
const now = Date.parse("2026-11-10T12:00:00Z");
const t = (hours: number, reminder_before: string, completed = false) => ({ completed, reminder_before, due_date: new Date(now + hours * 36e5).toISOString() });
describe("reminder windows", () => {
  it("1_day starts under 24h before due", () => { expect(reminderActive(t(23, "1_day"), now)).toBe(true); expect(reminderActive(t(25, "1_day"), now)).toBe(false); });
  it("1_hour starts under 1h before due", () => { expect(reminderActive(t(0.5, "1_hour"), now)).toBe(true); expect(reminderActive(t(2, "1_hour"), now)).toBe(false); });
  it("2_days starts under 48h before due", () => { expect(reminderActive(t(47, "2_days"), now)).toBe(true); expect(reminderActive(t(49, "2_days"), now)).toBe(false); });
  it("none and completed never remind", () => { expect(reminderActive(t(1, "none"), now)).toBe(false); expect(reminderActive(t(1, "1_day", true), now)).toBe(false); });
});
