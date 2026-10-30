import { describe, it, expect } from "vitest";
import { validatePasswordChange } from "@/lib/account";

describe("password change requirements", () => {
  it("requires at least eight characters", () => {
    expect(validatePasswordChange("1234567", "1234567")).not.toBeNull();
    expect(validatePasswordChange("12345678", "12345678")).toBeNull();
  });
  it("requires matching confirmation", () => {
    expect(validatePasswordChange("LongPassword", "DifferentPassword")).not.toBeNull();
    expect(validatePasswordChange("LongPassword", "LongPassword")).toBeNull();
  });
});