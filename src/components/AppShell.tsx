import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Download, GraduationCap, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { exportBackup } from "@/lib/planner";

const nav = [
  { to: "/", label: "Dashboard" },
  { to: "/tasks", label: "Assignments" },
  { to: "/courses", label: "Courses" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen">
      <header className="border-b bg-card/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold">
            <GraduationCap className="h-6 w-6 text-primary" /> Campus Planner
          </Link>
          <nav className="ml-auto flex flex-wrap gap-1">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/" }}
                className="btn-ghost" activeProps={{ className: "bg-accent text-accent-foreground" }}>
                {n.label}
              </Link>
            ))}
            <button className="btn-ghost" onClick={() => exportBackup().catch((e) => alert(e.message))} title="Download a backup of your data">
              <Download className="h-4 w-4" /> Backup
            </button>
            <button className="btn-ghost" aria-label="Sign out"
              onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); }}>
              <LogOut className="h-4 w-4" />
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
