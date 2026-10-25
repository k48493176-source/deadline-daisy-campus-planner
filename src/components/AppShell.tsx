import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { BookOpen, Download, LayoutDashboard, ListChecks, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { exportBackup } from "@/lib/planner";
import { Logo } from "@/components/Logo";

const nav = [
  { to: "/", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/tasks", label: "Assignments", Icon: ListChecks },
  { to: "/courses", label: "Courses", Icon: BookOpen },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return (
    <div className="min-h-screen">
      <header className="border-b bg-card/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-3 py-3 sm:px-4">
          <Link to="/" className="flex min-w-0 items-center gap-2 font-display text-lg font-semibold sm:text-xl" aria-label="Campus Planner home">
            <Logo className="h-8 w-8 shrink-0" />
            <span className="truncate">Campus Planner</span>
          </Link>
          <nav aria-label="Main" className="flex w-full flex-wrap gap-1 sm:ml-auto sm:w-auto">
            {nav.map(({ to, label, Icon }) => (
              <Link key={to} to={to} activeOptions={{ exact: to === "/" }} aria-label={label}
                className="btn-ghost min-h-11 px-3" activeProps={{ className: "bg-accent text-accent-foreground" }}>
                <Icon className="h-4 w-4" aria-hidden="true" /><span className="hidden min-[400px]:inline">{label}</span>
              </Link>
            ))}
            <button className="btn-ghost ml-auto min-h-11 px-3 sm:ml-0" onClick={() => exportBackup().catch((e) => alert(e.message))} aria-label="Download a backup of your data" title="Download a backup of your data">
              <Download className="h-4 w-4" aria-hidden="true" /><span className="hidden min-[400px]:inline">Backup</span>
            </button>
            <button className="btn-ghost min-h-11 px-3" aria-label="Sign out" title="Sign out"
              onClick={async () => {
                await queryClient.cancelQueries();
                queryClient.clear();
                await supabase.auth.signOut().catch(() => supabase.auth.signOut({ scope: "local" }));
                navigate({ to: "/auth", replace: true });
              }}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-3 py-6 sm:px-4 sm:py-8">{children}</main>
    </div>
  );
}
