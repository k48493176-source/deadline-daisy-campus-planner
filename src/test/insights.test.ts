import { describe, expect, it } from "vitest";
import { calculateInsights } from "@/lib/insights";

const task = (priority: string, completed: boolean, due_date = "2026-10-26T12:00:00") => ({ priority, completed, due_date });

describe("assignment insights", () => {
  it("calculates separate completion rates in high, medium, low order", () => {
    const result = calculateInsights([task("high", true), task("high", false), task("medium", true), task("low", false)]);
    expect(result.priorities.map(({ priority, percent }) => ({ priority, percent }))).toEqual([
      { priority: "high", percent: 50 }, { priority: "medium", percent: 100 }, { priority: "low", percent: 0 },
    ]);
  });
  it("counts only incomplete tasks strictly before now as overdue", () => {
    const now = new Date("2026-10-30T12:00:00");
    expect(calculateInsights([
      task("high", false), task("low", true), task("medium", false, "2026-11-02T12:00:00"),
      task("high", false, "2026-10-30T12:00:00"),
    ], now).overdue).toBe(1);
  });
  it("counts all deadlines by local weekday including completed tasks", () => {
    const result = calculateInsights([task("high", true), task("low", false), task("medium", false, "2026-10-27T12:00:00")]);
    expect(result.busiestDays).toEqual(["Monday"]);
    expect(result.maxDeadlines).toBe(2);
  });
  it("reports tied weekdays rather than selecting an arbitrary winner", () => {
    expect(calculateInsights([task("high", true), task("low", false, "2026-10-27T12:00:00")]).busiestDays).toEqual(["Monday", "Tuesday"]);
  });
  it("handles an account with no assignments", () => {
    const result = calculateInsights([]);
    expect(result.priorities.map((p) => p.percent)).toEqual([0, 0, 0]);
    expect(result.overdue).toBe(0);
    expect(result.busiestDays).toEqual([]);
    expect(result.maxDeadlines).toBe(0);
  });
});