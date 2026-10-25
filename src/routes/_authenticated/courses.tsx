import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { colorDot, coursesQuery, createCourse, tasksQuery } from "@/lib/planner";
import { BookOpen } from "lucide-react";

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
      <h1 className="flex items-center gap-2 text-3xl font-semibold sm:text-4xl"><BookOpen className="h-7 w-7 text-primary" aria-hidden="true" />Courses</h1>
      <p className="mt-2 text-muted-foreground">This semester's classes.</p>
      <AddCourse />
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

function AddCourse() {
  const qc = useQueryClient();
  const [f, setF] = useState({ code: "", name: "", instructor: "", color: "sage" });
  const [err, setErr] = useState<string | null>(null);
  return (
    <form className="card-surface mt-6 grid gap-2 p-4 sm:grid-cols-5" onSubmit={async (e) => {
      e.preventDefault(); setErr(null);
      try { await createCourse(f); setF({ code: "", name: "", instructor: "", color: "sage" }); qc.invalidateQueries({ queryKey: ["courses"] }); }
      catch (x) { setErr((x as Error).message); }
    }}>
      <input className="field" placeholder="Code (e.g. ICT 210)" aria-label="Course code" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} required />
      <input className="field sm:col-span-2" placeholder="Course name" aria-label="Course name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
      <input className="field" placeholder="Instructor" aria-label="Instructor" value={f.instructor} onChange={(e) => setF({ ...f, instructor: e.target.value })} />
      <button className="btn-primary">Add course</button>
      {err && <p className="text-sm text-destructive sm:col-span-5">{err}</p>}
    </form>
  );
}
