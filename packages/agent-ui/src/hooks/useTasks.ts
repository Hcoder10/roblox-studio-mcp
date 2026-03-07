import { useEffect, useState } from 'react';
import type { Task, WsEvent } from '../types';

export function useTasks(lastEvent: WsEvent | null) {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.type === 'task_created') {
      const task = lastEvent.payload as Task;
      setTasks((prev) => {
        if (prev.some((t) => t.id === task.id)) return prev;
        return [...prev, task];
      });
    }

    if (lastEvent.type === 'task_updated') {
      const data = lastEvent.payload as Partial<Task> & { id: string };
      setTasks((prev) => {
        const idx = prev.findIndex((t) => t.id === data.id);
        if (idx === -1) return prev;
        const updated = [...prev];
        updated[idx] = { ...prev[idx]!, ...data };
        return updated;
      });
    }
  }, [lastEvent]);

  return { tasks };
}
