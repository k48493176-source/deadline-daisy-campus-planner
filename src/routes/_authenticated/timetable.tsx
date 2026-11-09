import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarClock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ClassItem } from "@/components/ClassItem";
import { coursesQuery } from "@/lib/planner";
import { DAYS, classesQuery, createClass, deleteClass, groupByDay, isoWeekday } from "@/lib/timetable";

export const Route = createFileRoute("/_authenticated/timetable")({
  head: () => ({
    meta: [
      { title: "Timetable · Campus Planner" },
      { name: "description", content: "Your weekly class timetable with today's classes at a glance." },
      { property: "og:title", content: "Timetable · Campus Planner" },
      { property: "og:description", content: "Your weekly class timetable with today's classes at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Timetable,
});

function Timetable() {
  const qc = useQueryClient();
  const { data: classes = [], isLoading, isError } = useQuery(classesQuery);
  const today = isoWeekday();
  const week = groupByDay(classes);
  const todays = week[today - 1].classes;
  const remove = async (id: string) => {
    if (!confirm("Delete this class?")) return;
    try { await deleteClass(id); qc.invalidateQueries({ queryKey: ["classes"] }); } catch (e) { alert((e as Error).message); }
  };

  return (
    <AppShell>
      <h1 className="flex items-center gap-2 text-3xl font-semibold sm:text-4xl"><CalendarClock className="h-7 w-7 text-primary" aria-hidden="true" />Timetable</h1>
      <p className="mt-2 text-muted-foreground">Your weekly classes.</p>

      <AddClass />

      <section className="mt-8" aria-labelledby="today-h">
        <h2 id="today-h" className="text-2xl font-semibold">Today · {DAYS[today - 1]}</h2>
        <ul className="card-surface mt-3 divide-y">
          {isLoading && <li className="p-3 text-sm text-muted-foreground">Loading…</li>}
          {isError && <li className="p-3 text-sm text-destructive">Couldn't load your classes.</li>}
          {!isLoading && !isError && todays.length === 0 && <li className="p-3 text-sm text-muted-foreground">No classes today.</li>}
          {todays.map((c) => <ClassItem key={c.id} c={c} />)}
        </ul>
      </section>

      <section className="mt-8" aria-labelledby="week-h">
        <h2 id="week-h" className="text-2xl font-semibold">This week</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {week.map((d) => (
            <div key={d.day} className="card-surface" data-testid={`day-${d.day}`}>
              <h3 className={`border-b px-3 py-2 font-semibold ${d.day === today ? "text-primary" : ""}`}>{d.name}{d.day === today ? " (today)" : ""}</h3>
              <ul className="divide-y">
                {d.classes.length === 0 && <li className="p-3 text-sm text-muted-foreground">No classes</li>}
                {d.classes.map((c) => <ClassItem key={c.id} c={c} onDelete={() => remove(c.id)} />)}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function AddClass() {
  const qc = useQueryClient();
  const { data: courses = [] } = useQuery(coursesQuery);
  const empty = { course_id: "", day_of_week: String(isoWeekday()), start_time: "09:00", end_time: "10:30", room: "" };
  const [f, setF] = useState(empty);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <form className="card-surface mt-6 grid gap-2 p-4 sm:grid-cols-6" onSubmit={async (e) => {
      e.preventDefault(); setErr(null); setOk(false); setBusy(true);
      try {
        await createClass({ ...f, day_of_week: Number(f.day_of_week) });
        setF({ ...empty, course_id: f.course_id }); setOk(true);
        qc.invalidateQueries({ queryKey: ["classes"] });
      } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
    }}>
      <select className="field sm:col-span-2" aria-label="Course" value={f.course_id} onChange={(e) => setF({ ...f, course_id: e.target.value })} required>
        <option value="">Choose course…</option>
        {courses.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}
      </select>
      <select className="field" aria-label="Day of week" value={f.day_of_week} onChange={(e) => setF({ ...f, day_of_week: e.target.value })}>
        {DAYS.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}
      </select>
      <input type="time" className="field" aria-label="Start time" value={f.start_time} onChange={(e) => setF({ ...f, start_time: e.target.value })} required />
      <input type="time" className="field" aria-label="End time" value={f.end_time} onChange={(e) => setF({ ...f, end_time: e.target.value })} required />
      <input className="field" placeholder="Room (optional)" aria-label="Room (optional)" value={f.room} onChange={(e) => setF({ ...f, room: e.target.value })} />
      <button className="btn-primary sm:col-span-6" disabled={busy}>{busy ? "Adding…" : "Add class"}</button>
      {courses.length === 0 && <p className="text-sm text-muted-foreground sm:col-span-6">Add a course first on the Courses page.</p>}
      {err && <p role="alert" className="text-sm text-destructive sm:col-span-6">{err}</p>}
      {ok && <p role="status" className="text-sm text-muted-foreground sm:col-span-6">Class added.</p>}
    </form>
  );
}
