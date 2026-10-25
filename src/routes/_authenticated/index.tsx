import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { TaskRow } from "@/components/TaskRow";
import { coursesQuery, tasksQuery, userQuery } from "@/lib/planner";
import { CalendarDays } from "lucide-react";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Campus Planner" },
      { name: "description", content: "See upcoming deadlines, overdue work and progress across your courses." },
      { property: "og:title", content: "Dashboard · Campus Planner" },
      { property: "og:description", content: "See upcoming deadlines, overdue work and progress across your courses." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: user } = useQuery(userQuery);
  const { data: tasks = [], isLoading } = useQuery(tasksQuery);
  const { data: courses = [] } = useQuery(coursesQuery);
  const open = tasks.filter((t) => !t.completed);
  const overdue = open.filter((t) => new Date(t.due_date) < new Date());
  const week = open.filter((t) => { const d = new Date(t.due_date).getTime() - Date.now(); return d >= 0 && d < 7 * 864e5; });
  const done = tasks.length - open.length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  const stats = [
    { label: "Open", value: open.length },
    { label: "Due this week", value: week.length },
    { label: "Overdue", value: overdue.length, tone: overdue.length ? "text-destructive" : "" },
    { label: "Courses", value: courses.length },
  ];

  return (
    <AppShell>
      <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
      <h1 className="mt-1 text-4xl font-semibold">Hi{user ? `, ${user.full_name.split(" ")[0]}` : ""}.</h1>
      <p className="mt-2 text-muted-foreground">You have {week.length} deadline{week.length === 1 ? "" : "s"} in the next 7 days.</p>

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <p className={`mt-1 font-display text-3xl font-semibold ${s.tone ?? ""}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 card-surface p-5">
        <div className="flex justify-between text-sm"><span className="font-semibold">Semester progress</span><span className="text-muted-foreground">{done}/{tasks.length} done · {pct}%</span></div>
        <div className="mt-3 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} /></div>
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="flex items-center gap-2 text-2xl font-semibold"><CalendarDays className="h-6 w-6 text-primary" aria-hidden="true" />Up next</h2>
          <Link to="/tasks" className="btn-ghost">View all →</Link>
        </div>
        <ul className="card-surface divide-y">
          {isLoading && <li className="p-4 text-sm text-muted-foreground">Loading…</li>}
          {!isLoading && open.length === 0 && <li className="p-4 text-sm text-muted-foreground">All caught up 🎉</li>}
          {open.slice(0, 6).map((t) => <TaskRow key={t.id} task={t} />)}
        </ul>
      </section>
    </AppShell>
  );
}
