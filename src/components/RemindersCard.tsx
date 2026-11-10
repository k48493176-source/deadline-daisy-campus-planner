import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { dueLabel, type Task } from "@/lib/planner";
import { activeReminders, REMINDER_OPTIONS } from "@/lib/reminders";

export function RemindersCard({ tasks }: { tasks: Task[] }) {
  const list = activeReminders(tasks);
  const label = (v: string) => REMINDER_OPTIONS.find((o) => o.value === v)?.label ?? "";
  return (
    <section className="mt-6 card-surface p-5" aria-labelledby="reminders-h">
      <h2 id="reminders-h" className="flex items-center gap-2 text-lg font-semibold"><Bell className="h-5 w-5 text-primary" aria-hidden="true" />Reminders</h2>
      {list.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No reminders right now.</p> : (
        <ul className="mt-3 divide-y">
          {list.map((t) => { const d = dueLabel(t.due_date, false); return (
            <li key={t.id} className="flex items-center justify-between gap-3 py-2">
              <Link to="/tasks/$taskId" params={{ taskId: t.id }} className="min-w-0">
                <p className="truncate font-semibold">{t.title}</p>
                <p className="text-xs text-muted-foreground">{t.courses?.code} · {label(t.reminder_before ?? "none")}</p>
              </Link>
              <span className={`shrink-0 text-xs font-semibold ${d.tone}`}>{d.text}</span>
            </li>); })}
        </ul>
      )}
    </section>
  );
}
