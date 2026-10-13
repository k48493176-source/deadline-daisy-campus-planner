import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

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

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: "/" }); });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message); else navigate({ to: "/" });
    } else {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
      });
      setMsg(error ? error.message : "Check your email to confirm your account, then sign in.");
    }
    setBusy(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card-surface w-full max-w-sm p-6">
        <div className="flex items-center gap-2 font-display text-xl font-semibold">
          <GraduationCap className="h-6 w-6 text-primary" /> Campus Planner
        </div>
        <h1 className="mt-4 text-2xl font-semibold">{mode === "in" ? "Sign in" : "Create account"}</h1>
        <form onSubmit={submit} className="mt-4 space-y-3">
          {mode === "up" && (
            <input className="field w-full" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
          )}
          <input className="field w-full" type="email" placeholder="Email" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="field w-full" type="password" placeholder="Password" aria-label="Password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button className="btn-primary w-full" disabled={busy}>{mode === "in" ? "Sign in" : "Sign up"}</button>
        </form>
        <button className="btn-ghost mt-2 w-full" onClick={() => lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })}>
          Continue with Google
        </button>
        {msg && <p className="mt-3 text-sm text-muted-foreground">{msg}</p>}
        <button className="mt-4 text-sm text-primary underline" onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(null); }}>
          {mode === "in" ? "No account? Sign up" : "Have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
