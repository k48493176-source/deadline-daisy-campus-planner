// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("database task priority rule", () => {
  it("constrains every task to exactly low, medium, or high", () => {
    const sql = readFileSync("drizzle/migrations/0002_tasks_priority_allowed_values.sql", "utf8");
    const rule = sql.match(/ALTER TABLE public\.tasks ADD CONSTRAINT tasks_priority_allowed_values CHECK \(priority IN \(([^)]+)\)\)/);
    expect(rule).not.toBeNull();
    const allowed = Array.from((rule?.[1] ?? "").matchAll(/'([^']+)'/g), (match) => match[1]);
    expect(allowed).toEqual(["low", "medium", "high"]);
    expect(allowed).not.toContain("urgent");
  });
});