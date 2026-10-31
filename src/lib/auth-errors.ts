// Turns raw sign-in / sign-up failures into plain messages for students.
export type AuthErrorKind = "bad_credentials" | "unconfirmed" | "invalid_email" | "weak_password" | "exists" | "network" | "rate_limit" | "unknown";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email: string) {
  return EMAIL_RE.test(email.trim());
}

export function classifyAuthError(err: unknown): { kind: AuthErrorKind; message: string } {
  const e = (err ?? {}) as { code?: string; message?: string; name?: string; status?: number };
  const code = e.code ?? "";
  const msg = (e.message ?? String(err ?? "")).toLowerCase();

  if (e.name === "AuthRetryableFetchError" || e.name === "TimeoutError" || msg.includes("failed to fetch") || msg.includes("network") || msg.includes("timed out") || e.status === 0) {
    return { kind: "network", message: "Can't reach the server. Check your internet connection and try again." };
  }
  if (code === "invalid_credentials" || msg.includes("invalid login credentials")) {
    return { kind: "bad_credentials", message: "Wrong email or password" };
  }
  if (code === "email_not_confirmed" || msg.includes("email not confirmed")) {
    return { kind: "unconfirmed", message: "Email not confirmed" };
  }
  if (code === "email_address_invalid" || code === "validation_failed" || msg.includes("invalid email") || msg.includes("is invalid")) {
    return { kind: "invalid_email", message: "Please enter a valid email address." };
  }
  if (code === "weak_password" || msg.includes("password should") || msg.includes("weak") || msg.includes("pwned")) {
    return { kind: "weak_password", message: "That password is too weak or has appeared in a data leak. Use at least 8 characters and avoid common passwords." };
  }
  if (code === "user_already_exists" || msg.includes("already registered")) {
    return { kind: "exists", message: "An account with this email already exists. Sign in instead." };
  }
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit" || e.status === 429) {
    return { kind: "rate_limit", message: "Too many attempts. Please wait a minute and try again." };
  }
  return { kind: "unknown", message: e.message || "Something went wrong. Please try again." };
}

// Rejects if the request hangs, so buttons never spin forever.
export function withTimeout<T>(p: Promise<T>, ms = 15000): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      const err = new Error("Request timed out");
      err.name = "TimeoutError";
      reject(err);
    }, ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}
