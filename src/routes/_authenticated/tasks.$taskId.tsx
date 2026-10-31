import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Check, Clock, Flag, Trash2 } from "lucide-react";
import { PriorityIcon } from "@/components/PriorityBadge";
import { AppShell } from "@/components/AppShell";
import { colorDot, deleteTask, dueLabel, tasksQuery, toggleTask } from "@/lib/planner";

export const Route = createFileRoute("/_authenticated/tasks/$taskId")({
  head: () => ({
    meta: [
      { title: "Assignment details · Campus Planner" },
      { name: "description", content: "Details, due date and status for a course assignment." },
      { property: "og:title", content: "Assignment details · Campus Planner" },
      { property: "og:description", content: "Details, due date and status for a course assignment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TaskDetail,
});

function TaskDetail() {
  const { taskId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: tasks, isLoading } = useQuery(tasksQuery);
  const task = tasks?.find((t) => t.id === taskId);
  const refresh = () => qc.invalidateQueries({ queryKey: ["tasks"] });
  const toggle = useMutation({ mutationFn: () => toggleTask(taskId, !task?.completed), onSuccess: refresh });
  const remove = useMutation({ mutationFn: () => deleteTask(taskId), onSuccess: async () => { await refresh(); navigate({ to: "/tasks" }); } });

  return (
    <AppShell>
      <Link to="/tasks" className="btn-ghost -ml-3"><ArrowLeft className="h-4 w-4" />Assignments</Link>
      {isLoading && <p className="mt-6 text-muted-foreground">Loading…</p>}
      {!isLoading && !task && <p className="mt-6 text-muted-foreground">Assignment not found.</p>}
      {task && (
        <article className="card-surface mt-4 p-6 sm:p-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            <span className={`h-2.5 w-2.5 rounded-full ${colorDot[task.courses?.color ?? "sage"]}`} />{task.courses?.code} · {task.courses?.name}
          </div>
          <h1 className={`mt-3 text-3xl font-semibold ${task.completed ? "text-muted-foreground line-through" : ""}`}>{task.title}</h1>
          <dl className="mt-6 grid gap-4 sm:grid-cols-3">
            <div><dt className="flex items-center gap-1 text-xs uppercase text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />Due</dt><dd className="font-semibold">{new Date(task.due_date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</dd></div>
            <div><dt className="flex items-center gap-1 text-xs uppercase text-muted-foreground"><Clock className="h-3.5 w-3.5" aria-hidden="true" />Status</dt><dd className={`font-semibold ${dueLabel(task.due_date, task.completed).tone}`}>{dueLabel(task.due_date, task.completed).text}</dd></div>
            <div><dt className="flex items-center gap-1 text-xs uppercase text-muted-foreground"><Flag className="h-3.5 w-3.5" aria-hidden="true" />Priority</dt><dd className="flex items-center gap-1.5 font-semibold capitalize"><PriorityIcon priority={task.priority} />{task.priority}</dd></div>
          </dl>
          {task.description && <p className="mt-6 whitespace-pre-wrap text-foreground/80">{task.description}</p>}
          <div className="mt-8 flex flex-wrap gap-2">
            <button className="btn-primary" onClick={() => toggle.mutate()}><Check className="h-4 w-4" />{task.completed ? "Mark incomplete" : "Mark complete"}</button>
            <button className="btn-ghost text-destructive" onClick={() => confirm("Delete this assignment?") && remove.mutate()}><Trash2 className="h-4 w-4" />Delete</button>
          </div>
        </article>
      )}
    </AppShell>
  );
}
