import { BarChart3, CalendarDays, Clock } from "lucide-react";
import { calculateInsights } from "@/lib/insights";
import type { Task } from "@/lib/planner";

export function InsightsPanel({ tasks, loading, failed }: { tasks: Task[]; loading: boolean; failed: boolean }) {
  const insights = calculateInsights(tasks);
  return (
    <section aria-labelledby="insights-heading" className="mt-6 border-y py-5">
      <h2 id="insights-heading" className="flex items-center gap-2 text-2xl font-semibold">
        <BarChart3 aria-hidden="true" className="h-5 w-5 text-primary" />Insights
      </h2>
      {loading ? <p role="status" className="mt-3 text-sm text-muted-foreground">Loading insights…</p>
        : failed ? <p role="alert" className="mt-3 text-sm text-destructive">Your assignment insights couldn’t be loaded.</p>
        : <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="font-sans text-sm font-semibold">Completion by priority</h3>
            <div className="mt-3 space-y-3">
              {insights.priorities.map(({ priority, percent, total, completed }) => (
                <div key={priority}>
                  <div className="mb-1 flex justify-between gap-3 text-sm">
                    <span className="capitalize">{priority}</span>
                    <span className="tabular-nums text-muted-foreground">{percent}% <span className="text-xs">({completed}/{total})</span></span>
                  </div>
                  <div role="progressbar" aria-label={`${priority} priority completion`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-valuetext={`${percent}%, ${completed} of ${total} assignments completed`} className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <dl className="space-y-5">
            <div>
              <dt className="flex items-center gap-2 text-sm font-semibold"><Clock aria-hidden="true" className="h-4 w-4 text-muted-foreground" />Open overdue tasks</dt>
              <dd className={`mt-1 text-2xl font-semibold tabular-nums ${insights.overdue ? "text-destructive" : "text-foreground"}`}>{insights.overdue}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-sm font-semibold"><CalendarDays aria-hidden="true" className="h-4 w-4 text-muted-foreground" />Most deadlines</dt>
              <dd className="mt-1 break-words text-lg font-semibold">{insights.busiestDays.length ? insights.busiestDays.join(", ") : "No deadlines yet"}</dd>
              {insights.maxDeadlines > 0 && <dd className="mt-1 text-sm text-muted-foreground">{insights.maxDeadlines} deadline{insights.maxDeadlines === 1 ? "" : "s"}{insights.busiestDays.length > 1 ? " each · tied" : ""}</dd>}
            </div>
          </dl>
        </div>}
    </section>
  );
}