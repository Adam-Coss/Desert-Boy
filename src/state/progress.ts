import type { Task } from '../quests/tasks';

const TASKS_KEY = 'desertBoy.tasks';

export function loadTasks(): Task[] | null {
  const raw = localStorage.getItem(TASKS_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Task[]) : null;
  } catch {
    return null;
  }
}

export function saveTasks(tasks: Task[]): void {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}
