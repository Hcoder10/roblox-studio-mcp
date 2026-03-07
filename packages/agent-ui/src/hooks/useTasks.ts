import { useEffect, useState } from 'react';
import type { Task, WsEvent } from '../types';

type RawTask = Partial<Task> & { id?: string; task_id?: string };

function toTask(data: RawTask): Task | null {
  const id = data.id ?? data.task_id;
  if (!id) return null;

  return {
    id,
    title: data.title ?? id,
    description: data.description ?? '',
    status: data.status ?? 'pending',
    assigned_to: data.assigned_to ?? null,
    created_by: data.created_by ?? 'orchestrator',
    priority: data.priority ?? 3,
    dependencies: data.dependencies ?? [],
    error: data.error,
    created_at: data.created_at ?? Date.now(),
    started_at: data.started_at,
    completed_at: data.completed_at,
  };
}

export function useTasks(lastEvent: WsEvent | null) {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.type === 'agent_status_changed') {
      const payload = lastEvent.payload as { tasks?: RawTask[] };
      if (payload && Array.isArray(payload.tasks)) {
        setTasks(payload.tasks.map(toTask).filter((task): task is Task => task != null));
      }
      return;
    }

    if (lastEvent.type === 'task_created') {
      const payload = lastEvent.payload as RawTask | { tasks?: RawTask[] };
      if (payload && typeof payload === 'object' && 'tasks' in payload && Array.isArray(payload.tasks)) {
        setTasks(payload.tasks.map(toTask).filter((task): task is Task => task != null));
        return;
      }
      const task = toTask(payload as RawTask);
      if (!task) return;

      setTasks((prev) => {
        if (prev.some((t) => t.id === task.id)) return prev;
        return [...prev, task];
      });
    }

    if (lastEvent.type === 'task_updated') {
      const payload = lastEvent.payload as RawTask | { tasks?: RawTask[] };
      if (payload && typeof payload === 'object' && 'tasks' in payload && Array.isArray(payload.tasks)) {
        setTasks(payload.tasks.map(toTask).filter((task): task is Task => task != null));
        return;
      }

      const data = toTask(payload as RawTask);
      if (!data) return;

      setTasks((prev) => {
        const idx = prev.findIndex((t) => t.id === data.id);
        if (idx === -1) return [...prev, data];
        const updated = [...prev];
        updated[idx] = { ...prev[idx]!, ...data };
        return updated;
      });
    }
  }, [lastEvent]);

  return { tasks };
}
