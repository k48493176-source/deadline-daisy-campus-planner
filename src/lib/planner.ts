import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Course = { id: string; code: string; name: string; instructor: string | null; color: string };
export type Task = {
  id: string; course_id: string; title: string; description: string | null;
  due_date: string; priority: string; completed: boolean;
  courses: Pick<Course, "code" | "name" | "color"> | null;
};

export const userQuery = queryOptions({
  queryKey: ["user"],
  queryFn: async () => {
    const { data, error } = await supabase.from("users").select("*").maybeSingle();
    if (error) throw error;
    return data;
  },
});

export const coursesQuery = queryOptions({
  queryKey: ["courses"],
  queryFn: async () => {
    const { data, error } = await supabase.from("courses").select("*").order("code");
    if (error) throw error;
    return data as Course[];
  },
});

export const tasksQuery = queryOptions({
  queryKey: ["tasks"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("tasks").select("*, courses(code,name,color)").order("due_date");
    if (error) throw error;
    return data as Task[];
  },
});

export const colorDot: Record<string, string> = {
  sage: "bg-sage", clay: "bg-clay", sky: "bg-sky", plum: "bg-plum",
};

export function dueLabel(iso: string, completed: boolean) {
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  if (completed) return { text: "Done", tone: "text-muted-foreground" };
  if (days < 0) return { text: `${-days}d overdue`, tone: "text-destructive" };
  if (days === 0) return { text: "Due today", tone: "text-destructive" };
  if (days <= 2) return { text: `In ${days}d`, tone: "text-warning" };
  return { text: `In ${days}d`, tone: "text-muted-foreground" };
}

export async function toggleTask(id: string, completed: boolean) {
  const { error } = await supabase.from("tasks").update({ completed }).eq("id", id);
  if (error) throw error;
}
export async function deleteTask(id: string) {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}
export async function createTask(t: { course_id: string; title: string; description: string; due_date: string; priority: string }) {
  const { error } = await supabase.from("tasks").insert({ ...t, due_date: new Date(t.due_date).toISOString() });
  if (error) throw error;
}

// All writes go through the client's query builder, which sends values as
// parameters (never string-concatenated SQL). Ownership is enforced by RLS.
export async function createCourse(c: { code: string; name: string; instructor: string; color: string }) {
  const { data: me, error: e1 } = await supabase.from("users").select("id").single();
  if (e1) throw e1;
  const { error } = await supabase.from("courses").insert({ ...c, user_id: me.id });
  if (error) throw error;
}

export async function exportBackup() {
  const [u, c, t] = await Promise.all([
    supabase.from("users").select("*"),
    supabase.from("courses").select("*").order("code"),
    supabase.from("tasks").select("*").order("due_date"),
  ]);
  for (const r of [u, c, t]) if (r.error) throw r.error;
  const backup = {
    exported_at: new Date().toISOString(),
    counts: { users: u.data!.length, courses: c.data!.length, tasks: t.data!.length },
    users: u.data, courses: c.data, tasks: t.data,
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `campus-planner-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(a.href);
}
