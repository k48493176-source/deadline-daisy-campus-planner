import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarDays, Check, Trash2 } from "lucide-react";
import { colorDot, deleteTask, dueLabel, toggleTask, type Task } from "@/lib/planner";
import { PriorityIcon } from "@/components/PriorityBadge";

export function TaskRow({ task }: { task: Task }) {
  const qc = useQueryClient();
  const [pop, setPop] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ["tasks"] });
  const toggle = useMutation({ mutationFn: () => toggleTask(task.id, !task.completed), onSuccess: refresh });
  const remove = useMutation({ mutationFn: () => deleteTask(task.id), onSuccess: refresh });
  const due = dueLabel(task.due_date, task.completed);

  return (
    <li className={`flex items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4 ${pop ? "animate-task-done" : ""}`} onAnimationEnd={() => setPop(false)}>
      <button
        aria-label={task.completed ? `Mark "${task.title}" incomplete` : `Mark "${task.title}" complete`}
        aria-pressed={task.completed}
        onClick={() => { if (!task.completed) setPop(true); toggle.mutate(); }}
        className="grid h-11 w-11 shrink-0 place-items-center"
      >
        <span className={`grid h-5 w-5 place-items-center rounded-full border-2 transition ${task.completed ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"} ${pop ? "animate-check-pop" : ""}`}>
          {task.completed && <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />}
        </span>
      </button>
      <Link to="/tasks/$taskId" params={{ taskId: task.id }} className="min-w-0 flex-1">
        <p className={`flex items-center gap-1.5 font-semibold ${task.completed ? "text-muted-foreground line-through" : ""}`}>
          <PriorityIcon priority={task.priority} className="h-3.5 w-3.5" />
          <span className="sr-only">{task.priority} priority, </span>
          <span className="truncate">{task.title}</span>
        </p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={`h-2 w-2 shrink-0 rounded-full ${colorDot[task.courses?.color ?? "sage"]}`} aria-hidden="true" />
          <span className="truncate">{task.courses?.code}</span>
          <CalendarDays className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span className="shrink-0">{new Date(task.due_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
        </p>
      </Link>
      <span className={`hidden text-xs font-semibold sm:inline ${due.tone}`}>{due.text}</span>
      <button aria-label={`Delete "${task.title}"`} onClick={() => confirm("Delete this assignment?") && remove.mutate()} className="btn-ghost min-h-11 min-w-11 justify-center px-2">
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
    </li>
  );
}
