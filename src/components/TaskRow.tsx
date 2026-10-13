import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Trash2 } from "lucide-react";
import { colorDot, deleteTask, dueLabel, toggleTask, type Task } from "@/lib/planner";

export function TaskRow({ task }: { task: Task }) {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["tasks"] });
  const toggle = useMutation({ mutationFn: () => toggleTask(task.id, !task.completed), onSuccess: refresh });
  const remove = useMutation({ mutationFn: () => deleteTask(task.id), onSuccess: refresh });
  const due = dueLabel(task.due_date, task.completed);

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <button
        aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
        onClick={() => toggle.mutate()}
        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition ${task.completed ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
      >
        {task.completed && <Check className="h-3 w-3" strokeWidth={3} />}
      </button>
      <Link to="/tasks/$taskId" params={{ taskId: task.id }} className="min-w-0 flex-1">
        <p className={`truncate font-semibold ${task.completed ? "text-muted-foreground line-through" : ""}`}>{task.title}</p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={`h-2 w-2 rounded-full ${colorDot[task.courses?.color ?? "sage"]}`} />
          {task.courses?.code} · {new Date(task.due_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </p>
      </Link>
      <span className={`hidden text-xs font-semibold sm:inline ${due.tone}`}>{due.text}</span>
      <button aria-label="Delete assignment" onClick={() => confirm("Delete this assignment?") && remove.mutate()} className="btn-ghost px-2">
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}
