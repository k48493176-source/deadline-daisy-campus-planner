import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { colorDot, coursesQuery, tasksQuery } from "@/lib/planner";

export const Route = createFileRoute("/_authenticated/courses")({
  head: () => ({
    meta: [
      { title: "Courses · Campus Planner" },
      { name: "description", content: "Your enrolled courses with instructors and assignment progress." },
      { property: "og:title", content: "Courses · Campus Planner" },
      { property: "og:description", content: "Your enrolled courses with instructors and assignment progress." },
    ],
  }),
  component: Courses,
});

function Courses() {
  const { data: courses = [], isLoading } = useQuery(coursesQuery);
  const { data: tasks = [] } = useQuery(tasksQuery);
  return (
    <AppShell>
      <h1 className="text-4xl font-semibold">Courses</h1>
      <p className="mt-2 text-muted-foreground">This semester's classes.</p>
      {isLoading && <p className="mt-6 text-sm text-muted-foreground">Loading…</p>}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {courses.map((c) => {
          const ct = tasks.filter((t) => t.course_id === c.id);
          const done = ct.filter((t) => t.completed).length;
          const pct = ct.length ? (done / ct.length) * 100 : 0;
          return (
            <Link key={c.id} to="/tasks" search={{ course: c.id }} className="card-surface block p-5 transition hover:-translate-y-0.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                <span className={`h-2.5 w-2.5 rounded-full ${colorDot[c.color]}`} />{c.code}
              </div>
              <h2 className="mt-2 text-xl font-semibold">{c.name}</h2>
              <p className="text-sm text-muted-foreground">{c.instructor}</p>
              <div className="mt-4 flex justify-between text-xs text-muted-foreground"><span>{ct.length - done} open</span><span>{done}/{ct.length} done</span></div>
              <div className="mt-1.5 h-1.5 rounded-full bg-muted"><div className={`h-1.5 rounded-full ${colorDot[c.color]}`} style={{ width: `${pct}%` }} /></div>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
