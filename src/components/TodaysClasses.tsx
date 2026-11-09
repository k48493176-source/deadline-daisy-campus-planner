import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock } from "lucide-react";
import { ClassItem } from "@/components/ClassItem";
import { DAYS, classesQuery, groupByDay, isoWeekday } from "@/lib/timetable";

export function TodaysClasses() {
  const { data: classes = [], isLoading, isError } = useQuery(classesQuery);
  const today = isoWeekday();
  const todays = groupByDay(classes)[today - 1]?.classes ?? [];
  return (
    <section className="mt-6 card-surface" aria-labelledby="todays-classes-h">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 id="todays-classes-h" className="flex items-center gap-2 font-semibold"><CalendarClock className="h-5 w-5 text-primary" aria-hidden="true" />Today's classes · {DAYS[today - 1]}</h2>
        <Link to="/timetable" className="btn-ghost text-sm">Timetable →</Link>
      </div>
      <ul className="divide-y">
        {isLoading && <li className="p-3 text-sm text-muted-foreground">Loading…</li>}
        {isError && <li className="p-3 text-sm text-destructive">Couldn't load your classes.</li>}
        {!isLoading && !isError && todays.length === 0 && <li className="p-3 text-sm text-muted-foreground">No classes today.</li>}
        {todays.map((c) => <ClassItem key={c.id} c={c} />)}
      </ul>
    </section>
  );
}
