import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { groupByDay, isoWeekday, validateClass } from "@/lib/timetable";

const base = { course_id: "c1", day_of_week: 1, start_time: "09:00", end_time: "10:30" };

describe("timetable rules", () => {
  it("rejects an end time that is not after the start time", () => {
    expect(validateClass({ ...base, end_time: "09:00" })).toBe("End time must be after start time.");
    expect(validateClass({ ...base, end_time: "08:00" })).toBe("End time must be after start time.");
    expect(validateClass(base)).toBeNull();
  });
  it("only allows days 1 to 7", () => {
    expect(validateClass({ ...base, day_of_week: 0 })).not.toBeNull();
    expect(validateClass({ ...base, day_of_week: 8 })).not.toBeNull();
    expect(validateClass({ ...base, day_of_week: 7 })).toBeNull();
  });
  it("treats Monday as 1 and Sunday as 7", () => {
    expect(isoWeekday(new Date(2026, 10, 9))).toBe(1);
    expect(isoWeekday(new Date(2026, 10, 15))).toBe(7);
  });
  it("groups Monday to Sunday sorted by start time", () => {
    const mk = (id: string, d: number, s: string) => ({ id, course_id: "c", day_of_week: d, start_time: s, end_time: "23:00", room: null, courses: null });
    const w = groupByDay([mk("b", 1, "11:00"), mk("a", 1, "08:00"), mk("s", 7, "10:00")]);
    expect(w.map((d) => d.name)).toEqual(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]);
    expect(w[0].classes.map((c) => c.id)).toEqual(["a", "b"]);
    expect(w[6].classes.map((c) => c.id)).toEqual(["s"]);
  });
  it("database enforces day range, end after start and owner-only access", () => {
    const sql = readFileSync("drizzle/migrations/0003_create_classes_timetable.sql", "utf8");
    expect(sql).toContain("CHECK (day_of_week BETWEEN 1 AND 7)");
    expect(sql).toContain("CHECK (end_time > start_time)");
    expect(sql).toContain("ENABLE ROW LEVEL SECURITY");
    expect(sql).not.toMatch(/GRANT [^;]* TO anon/);
    expect((sql.match(/owns_course\(course_id\)/g) ?? []).length).toBe(5);
  });
});
