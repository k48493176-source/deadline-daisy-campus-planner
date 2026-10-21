import { describe, expect, it } from "vitest";
import { classifyAuthError, isValidEmail, withTimeout } from "@/lib/auth-errors";

describe("auth error messages", () => {
  it("wrong password shows incorrect email or password", () => {
    expect(classifyAuthError({ code: "invalid_credentials", message: "Invalid login credentials", status: 400 }).kind).toBe("bad_credentials");
  });
  it("unconfirmed email is reported as unconfirmed", () => {
    expect(classifyAuthError({ code: "email_not_confirmed", message: "Email not confirmed" }).kind).toBe("unconfirmed");
  });
  it("network failure is reported as a connection problem", () => {
    expect(classifyAuthError(new TypeError("Failed to fetch")).kind).toBe("network");
    expect(classifyAuthError({ name: "AuthRetryableFetchError", message: "{}", status: 0 }).kind).toBe("network");
  });
  it("invalid email is caught before sending", () => {
    expect(isValidEmail("student@campus.edu")).toBe(true);
    expect(isValidEmail("student@campus")).toBe(false);
    expect(isValidEmail("not-an-email")).toBe(false);
  });
  it("hung requests time out instead of loading forever", async () => {
    await expect(withTimeout(new Promise(() => {}), 20)).rejects.toThrow("timed out");
  });
});
