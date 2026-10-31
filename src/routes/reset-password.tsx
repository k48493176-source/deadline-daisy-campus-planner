import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/PasswordField";
import { validatePasswordChange } from "@/lib/account";
import { classifyAuthError, withTimeout } from "@/lib/auth-errors";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password · Campus Planner" },
      { name: "description", content: "Choose a new password for your Campus Planner account." },
      { property: "og:title", content: "Set a new password · Campus Planner" },
      { property: "og:description", content: "Choose a new password for your Campus Planner account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "error" | "info"; text: string } | null>(null);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    const hasRecovery = window.location.hash.includes("type=recovery") || window.location.search.includes("code=");
    supabase.auth.getSession().then(({ data: s }) => {
      if (s.session) setReady(true);
      else if (!hasRecovery) setReady(false);
    });
    const t = setTimeout(() => setReady((r) => r ?? false), 5000);
    return () => { data.subscription.unsubscribe(); clearTimeout(t); };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const problem = validatePasswordChange(password, confirm);
    if (problem) return setNotice({ tone: "error", text: problem });
    setBusy(true); setNotice(null);
    try {
      const { error } = await withTimeout(supabase.auth.updateUser({ password }));
      if (error) return setNotice({ tone: "error", text: classifyAuthError(error).message });
      setNotice({ tone: "info", text: "Your password was changed. Taking you to your planner…" });
      setTimeout(() => navigate({ to: "/", replace: true }), 1200);
    } catch (err) {
      setNotice({ tone: "error", text: classifyAuthError(err).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card-surface w-full max-w-sm p-6">
        <div className="flex items-center gap-2 font-display text-xl font-semibold">
          <GraduationCap className="h-6 w-6 text-primary" aria-hidden="true" /> Campus Planner
        </div>
        <h1 className="mt-4 text-2xl font-semibold">Set a new password</h1>
        {ready === false ? (
          <div className="mt-4 space-y-3 text-sm">
            <p role="alert" className="text-destructive">This reset link is invalid or has expired. Request a new one from the sign-in page.</p>
            <Button type="button" className="btn-primary w-full" onClick={() => navigate({ to: "/auth" })}>Back to sign in</Button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="mt-4 space-y-3">
            <PasswordField autoComplete="new-password" placeholder="New password (at least 8 characters)" aria-label="New password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <PasswordField autoComplete="new-password" placeholder="Confirm new password" aria-label="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            <Button type="submit" className="btn-primary w-full" disabled={busy || ready !== true}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {busy ? "Saving…" : "Save new password"}
            </Button>
          </form>
        )}
        {notice && (
          <div role={notice.tone === "error" ? "alert" : "status"}
            className={`mt-3 rounded-md border px-3 py-2 text-sm ${notice.tone === "error" ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-border bg-accent text-accent-foreground"}`}>
            {notice.text}
          </div>
        )}
      </div>
    </div>
  );
}
