type InsightTask = { priority: string; completed: boolean; due_date: string };

export function calculateInsights(tasks: InsightTask[], now = new Date()) {
  const priorities = (["high", "medium", "low"] as const).map((priority) => {
    const group = tasks.filter((task) => task.priority === priority);
    const completed = group.filter((task) => task.completed).length;
    return { priority, total: group.length, completed, percent: group.length ? Math.round(completed / group.length * 100) : 0 };
  });
  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const counts = weekdays.map(() => 0);
  let overdue = 0;
  for (const task of tasks) {
    const due = new Date(task.due_date);
    if (!Number.isFinite(due.getTime())) continue;
    const weekday = (due.getDay() + 6) % 7;
    counts[weekday] = (counts[weekday] ?? 0) + 1;
    if (!task.completed && due.getTime() < now.getTime()) overdue += 1;
  }
  const maxDeadlines = Math.max(...counts);
  const busiestDays = maxDeadlines ? weekdays.filter((_, index) => counts[index] === maxDeadlines) : [];
  return { priorities, overdue, busiestDays, maxDeadlines };
}