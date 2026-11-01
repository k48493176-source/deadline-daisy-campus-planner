import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { GraduationCap, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/PasswordField";
import { classifyAuthError, isValidEmail, withTimeout, type AuthErrorKind } from "@/lib/auth-errors";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · Campus Planner" },
      { name: "description", content: "Sign in to Campus Planner to manage your own courses and deadlines." },
      { property: "og:title", content: "Sign in · Campus Planner" },
      { property: "og:description", content: "Sign in to Campus Planner to manage your own courses and deadlines." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

type Mode = "in" | "up";
type Notice = { tone: "error" | "info"; text: string; kind?: AuthErrorKind };

const TABS: { mode: Mode; label: string }[] = [
  { mode: "in", label: "Sign in" },
  { mode: "up", label: "Create account" },
];

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busy, setBusy] = useState<null | "form" | "resend" | "reset">(null);
  const tabRefs = useRef<Record<Mode, HTMLButtonElement | null>>({ in: null, up: null });

  // Validate an existing identity before redirecting; stale sessions must not loop.
  useEffect(() => {
    let active = true;
    withTimeout(supabase.auth.getUser()).then(({ data }) => {
      if (active && data.user) navigate({ to: "/", replace: true });
    }).catch(() => {});
    return () => { active = false; };
  }, [navigate]);

  function switchMode(next: Mode) {
    setMode(next);
    setNotice(null);
  }

  // Arrow keys move focus between the two tabs, as a tablist is expected to.
  function onTabKeyDown(e: React.KeyboardEvent) {
    const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const index = TABS.findIndex((tab) => tab.mode === mode);
    const step = e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1;
    const nextIndex = e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : (index + step + TABS.length) % TABS.length;
    const next = TABS[nextIndex];
    switchMode(next.mode);
    tabRefs.current[next.mode]?.focus();
  }

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
        setNotice({ tone: "info", text: "Check your email to confirm your account", kind: "unconfirmed" });
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

  async function sendReset() {
    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      setNotice({ tone: "error", text: "Enter your email above first.", kind: "invalid_email" });
      return;
    }
    setBusy("reset"); setNotice(null);
    try {
      const { error } = await withTimeout(supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo: `${window.location.origin}/reset-password` }));
      if (error) return fail(error);
      setNotice({ tone: "info", text: "Check your email to reset your password" });
    } catch (err) {
      fail(err);
    } finally {
      setBusy(null);
    }
  }

  const showResend = notice?.kind === "unconfirmed";
  // A refused sign-in points the student at the Create account tab.
  const offerSignUp = notice?.tone === "error" && notice.kind === "bad_credentials" && mode === "in";
  const noticeText = notice ? (offerSignUp ? `${notice.text}. No account yet? Create one.` : notice.text) : "";

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card-surface w-full max-w-sm p-6">
        <div className="flex items-center gap-2 font-display text-xl font-semibold">
          <GraduationCap className="h-6 w-6 text-primary" /> Campus Planner
        </div>
        <div role="tablist" aria-label="Sign in or create an account" className="mt-4 grid grid-cols-2 gap-1 rounded-md border border-border bg-muted p-1">
          {TABS.map((tab) => {
            const selected = mode === tab.mode;
            return (
              <button
                key={tab.mode}
                ref={(el) => { tabRefs.current[tab.mode] = el; }}
                type="button"
                role="tab"
                id={`auth-tab-${tab.mode}`}
                aria-selected={selected}
                aria-controls="auth-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => switchMode(tab.mode)}
                onKeyDown={onTabKeyDown}
                className={`rounded px-3 py-2 text-sm font-medium transition-colors ${
                  selected ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <div role="tabpanel" id="auth-panel" aria-labelledby={`auth-tab-${mode}`} tabIndex={-1} className="focus-visible:outline-none">
          <h1 className="mt-4 text-2xl font-semibold">{mode === "in" ? "Sign in" : "Create account"}</h1>
          <form onSubmit={submit} noValidate className="mt-4 space-y-3">
            {mode === "up" && (
              <input className="field w-full" placeholder="Full name" aria-label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
            )}
            <input className="field w-full" type="email" autoComplete="email" placeholder="Email" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <PasswordField autoComplete={mode === "in" ? "current-password" : "new-password"} placeholder="Password" aria-label="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {mode === "in" && (
              <Button type="button" variant="link" className="h-auto p-0 text-sm text-primary underline" disabled={busy !== null} onClick={sendReset}>
                {busy === "reset" ? "Sending…" : "Forgot password?"}
              </Button>
            )}
            <Button type="submit" className="btn-primary w-full" disabled={busy !== null} aria-busy={busy === "form"}>
              {busy === "form" && <Loader2 className="h-4 w-4 animate-spin" />}
              {busy === "form" ? (mode === "in" ? "Signing in…" : "Creating account…") : (mode === "in" ? "Sign in" : "Create account")}
            </Button>
          </form>
          {notice && (
            <div role={notice.tone === "error" ? "alert" : "status"}
              className={`mt-3 rounded-md border px-3 py-2 text-sm ${notice.tone === "error" ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-border bg-accent text-accent-foreground"}`}>
              <p>{noticeText}</p>
              {offerSignUp && (
                <Button type="button" size="sm" variant="outline" className="mt-2" disabled={busy !== null} onClick={() => switchMode("up")}>
                  Create account
                </Button>
              )}
            </div>
          )}
          {showResend && (
            <Button type="button" variant="link" className="mt-2 h-auto p-0 text-sm text-primary underline disabled:opacity-60" disabled={busy !== null} onClick={resend}>
              {busy === "resend" ? "Sending…" : "Resend confirmation email"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
