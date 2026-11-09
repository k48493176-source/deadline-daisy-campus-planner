import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ClassSlot = {
  id: string; course_id: string; day_of_week: number;
  start_time: string; end_time: string; room: string | null;
  courses: { code: string; name: string; color: string } | null;
};

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

/** ISO weekday: Monday = 1 … Sunday = 7. */
export function isoWeekday(d: Date = new Date()) {
  return ((d.getDay() + 6) % 7) + 1;
}

export function hhmm(t: string) {
  return t.slice(0, 5);
}

export function validateClass(c: { course_id: string; day_of_week: number; start_time: string; end_time: string }) {
  if (!c.course_id) return "Choose a course.";
  if (!Number.isInteger(c.day_of_week) || c.day_of_week < 1 || c.day_of_week > 7) return "Choose a day of the week.";
  if (!c.start_time || !c.end_time) return "Enter a start and end time.";
  if (c.end_time <= c.start_time) return "End time must be after start time.";
  return null;
}

/** Groups classes into Monday..Sunday buckets, each sorted by start time. */
export function groupByDay(classes: ClassSlot[]) {
  return DAYS.map((name, i) => ({
    day: i + 1,
    name,
    classes: classes.filter((c) => c.day_of_week === i + 1).sort((a, b) => a.start_time.localeCompare(b.start_time)),
  }));
}

export const classesQuery = queryOptions({
  queryKey: ["classes"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("classes").select("*, courses(code,name,color)").order("day_of_week").order("start_time");
    if (error) throw error;
    return data as ClassSlot[];
  },
});

export async function createClass(c: { course_id: string; day_of_week: number; start_time: string; end_time: string; room: string }) {
  const err = validateClass(c);
  if (err) throw new Error(err);
  const { error } = await supabase.from("classes").insert({ ...c, room: c.room.trim() || null });
  if (error) throw error;
}

export async function deleteClass(id: string) {
  const { error } = await supabase.from("classes").delete().eq("id", id);
  if (error) throw error;
}
