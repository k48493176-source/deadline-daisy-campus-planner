import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { classifyAuthError, isValidEmail, withTimeout, type AuthErrorKind } from "@/lib/auth-errors";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · Campus Planner" },
      { name: "description", content: "Sign in to Campus Planner to manage your own courses and deadlines." },
      { property: "og:title", content: "Sign in · Campus Planner" },
      { property: "og:description", content: "Sign in to Campus Planner to manage your own courses and deadlines." },
    ],
  }),
  component: AuthPage,
});

type Notice = { tone: "error" | "info"; text: string; kind?: AuthErrorKind };

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busy, setBusy] = useState<null | "form" | "google" | "resend">(null);

  // Already signed in? Go straight to the dashboard (local check, no network wait).
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) navigate({ to: "/", replace: true });
    }).catch(() => {});
    return () => { active = false; };
  }, [navigate]);

  function fail(err: unknown) {
    const { kind, message } = classifyAuthError(err);
    setNotice({ tone: "error", text: message, kind });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      setNotice({ tone: "error", text: "Please enter a valid email address.", kind: "invalid_email" });
      return;
    }
    if (password.length < 6) {
      setNotice({ tone: "error", text: "Password must be at least 6 characters." });
      return;
    }
    setBusy("form"); setNotice(null);
    try {
      if (mode === "in") {
        const { data, error } = await withTimeout(supabase.auth.signInWithPassword({ email: cleanEmail, password }));
        if (error) return fail(error);
        if (data.session) navigate({ to: "/", replace: true });
      } else {
        const { data, error } = await withTimeout(supabase.auth.signUp({
          email: cleanEmail, password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name.trim() } },
        }));
        if (error) return fail(error);
        if (data.session) return navigate({ to: "/", replace: true });
        // An existing confirmed email returns a user with no identities.
        if (data.user && (data.user.identities?.length ?? 0) === 0) {
          setNotice({ tone: "error", text: "An account with this email already exists. Sign in instead.", kind: "exists" });
          setMode("in");
          return;
        }
        setNotice({ tone: "info", text: `We sent a confirmation link to ${cleanEmail}. Open it, then sign in here. Check your spam folder if it doesn't arrive.`, kind: "unconfirmed" });
        setMode("in");
      }
    } catch (err) {
      fail(err);
    } finally {
      setBusy(null);
    }
  }

  async function resend() {
    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      setNotice({ tone: "error", text: "Enter your email above first.", kind: "invalid_email" });
      return;
    }
    setBusy("resend");
    try {
      const { error } = await withTimeout(supabase.auth.resend({
        type: "signup", email: cleanEmail, options: { emailRedirectTo: window.location.origin },
      }));
      if (error) return fail(error);
      setNotice({ tone: "info", text: `A new confirmation link was sent to ${cleanEmail}. Only the newest link works.`, kind: "unconfirmed" });
    } catch (err) {
      fail(err);
    } finally {
      setBusy(null);
    }
  }

  async function google() {
    if (busy) return;
    setBusy("google"); setNotice(null);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (result.error) return fail(result.error);
      if (result.redirected) return;
      navigate({ to: "/", replace: true });
    } catch (err) {
      fail(err);
    } finally {
      setBusy(null);
    }
  }

  const showResend = notice?.kind === "unconfirmed" || notice?.kind === "bad_credentials";

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card-surface w-full max-w-sm p-6">
        <div className="flex items-center gap-2 font-display text-xl font-semibold">
          <GraduationCap className="h-6 w-6 text-primary" /> Campus Planner
        </div>
        <h1 className="mt-4 text-2xl font-semibold">{mode === "in" ? "Sign in" : "Create account"}</h1>
        <form onSubmit={submit} noValidate className="mt-4 space-y-3">
          {mode === "up" && (
            <input className="field w-full" placeholder="Full name" aria-label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
          )}
          <input className="field w-full" type="email" autoComplete="email" placeholder="Email" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="field w-full" type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} placeholder="Password" aria-label="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" className="btn-primary w-full" disabled={busy !== null} aria-busy={busy === "form"}>
            {busy === "form" && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy === "form" ? (mode === "in" ? "Signing in…" : "Creating account…") : (mode === "in" ? "Sign in" : "Sign up")}
          </button>
        </form>
        <button type="button" className="btn-ghost mt-2 w-full" disabled={busy !== null} onClick={google}>
          {busy === "google" && <Loader2 className="h-4 w-4 animate-spin" />}
          Continue with Google
        </button>
        {notice && (
          <div role={notice.tone === "error" ? "alert" : "status"}
            className={`mt-3 rounded-md border px-3 py-2 text-sm ${notice.tone === "error" ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-border bg-accent text-accent-foreground"}`}>
            {notice.text}
          </div>
        )}
        {showResend && (
          <button type="button" className="mt-2 text-sm text-primary underline disabled:opacity-60" disabled={busy !== null} onClick={resend}>
            {busy === "resend" ? "Sending…" : "Resend confirmation email"}
          </button>
        )}
        <button type="button" className="mt-4 block text-sm text-primary underline" disabled={busy !== null}
          onClick={() => { setMode(mode === "in" ? "up" : "in"); setNotice(null); }}>
          {mode === "in" ? "No account? Sign up" : "Have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
