import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { ListChecks, Plus, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TaskRow } from "@/components/TaskRow";
import { REMINDER_OPTIONS } from "@/lib/reminders";
import { coursesQuery, createTask, tasksQuery } from "@/lib/planner";

type Search = { course?: string | undefined; status?: "open" | "done" | "all" | undefined };

export const Route = createFileRoute("/_authenticated/tasks/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    course: typeof s["course"] === "string" ? s["course"] : undefined,
    status: s["status"] === "done" || s["status"] === "all" ? s["status"] : s["status"] === "open" ? "open" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Assignments · Campus Planner" },
      { name: "description", content: "Add, filter, complete and delete your course assignments." },
      { property: "og:title", content: "Assignments · Campus Planner" },
      { property: "og:description", content: "Add, filter, complete and delete your course assignments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Tasks,
});

function Tasks() {
  const { course, status = "open" } = Route.useSearch();
  const navigate = useNavigate({ from: "/tasks/" });
  const { data: tasks = [], isLoading } = useQuery(tasksQuery);
  const { data: courses = [] } = useQuery(coursesQuery);
  const [showForm, setShowForm] = useState(false);

  const list = tasks.filter((t) => (!course || t.course_id === course) &&
    (status === "all" || (status === "done" ? t.completed : !t.completed)));

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-semibold sm:text-4xl"><ListChecks className="h-7 w-7 text-primary" aria-hidden="true" />Assignments</h1>
          <p className="mt-2 text-muted-foreground">{list.length} shown</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{showForm ? "Close" : "Add assignment"}
        </button>
      </div>

      {showForm && <TaskForm courses={courses} defaultCourse={course} onDone={() => setShowForm(false)} />}

      <div className="mt-6 flex flex-wrap gap-2">
        <select aria-label="Filter by course" className="field w-full min-w-0 sm:w-auto" value={course ?? ""} onChange={(e) => navigate({ search: (p) => ({ ...p, course: e.target.value || undefined }) })}>
          <option value="">All courses</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
        </select>
        <div className="flex rounded-md border bg-card p-0.5">
          {(["open", "done", "all"] as const).map((s) => (
            <button key={s} onClick={() => navigate({ search: (p) => ({ ...p, status: s }) })}
              className={`rounded px-3 py-1.5 text-sm font-semibold capitalize ${status === s ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}>{s}</button>
          ))}
        </div>
      </div>

      <ul className="card-surface mt-4 divide-y">
        {isLoading && <li className="p-4 text-sm text-muted-foreground">Loading…</li>}
        {!isLoading && list.length === 0 && <li className="p-4 text-sm text-muted-foreground">Nothing here.</li>}
        {list.map((t) => <TaskRow key={t.id} task={t} />)}
      </ul>
    </AppShell>
  );
}

function TaskForm({ courses, defaultCourse, onDone }: { courses: { id: string; code: string; name: string }[]; defaultCourse?: string | undefined; onDone: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ course_id: defaultCourse ?? "", title: "", description: "", due_date: "", priority: "medium", reminder_before: "none" });
  const m = useMutation({
    mutationFn: () => createTask(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); onDone(); },
  });
  const submit = (e: FormEvent) => { e.preventDefault(); m.mutate(); };
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  return (
    <form onSubmit={submit} className="card-surface mt-6 grid gap-3 p-5 sm:grid-cols-2">
      <label className="text-sm font-semibold sm:col-span-2">Title<input required className="field mt-1" value={form.title} onChange={set("title")} placeholder="e.g. Lab report 4" /></label>
      <label className="text-sm font-semibold">Course
        <select required className="field mt-1" value={form.course_id} onChange={set("course_id")}>
          <option value="" disabled>Select a course</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
        </select>
      </label>
      <label className="text-sm font-semibold">Due<input required type="datetime-local" className="field mt-1" value={form.due_date} onChange={set("due_date")} /></label>
      <label className="text-sm font-semibold">Priority
        <select className="field mt-1" value={form.priority} onChange={set("priority")}>
          <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
        </select>
      </label>
      <label className="text-sm font-semibold">Remind me
        <select className="field mt-1" value={form.reminder_before} onChange={set("reminder_before")}>
          {REMINDER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </label>
      <label className="text-sm font-semibold sm:col-span-2">Notes<textarea rows={2} className="field mt-1" value={form.description} onChange={set("description")} /></label>
      {m.error && <p className="text-sm text-destructive sm:col-span-2">{(m.error as Error).message}</p>}
      <div className="sm:col-span-2"><button className="btn-primary" disabled={m.isPending}>{m.isPending ? "Saving…" : "Save assignment"}</button></div>
    </form>
  );
}
