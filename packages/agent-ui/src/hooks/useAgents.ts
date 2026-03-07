import { useEffect, useState } from 'react';
import type { Agent, WsEvent } from '../types';

export function useAgents(lastEvent: WsEvent | null) {
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.type === 'agent_status_changed') {
      const data = lastEvent.payload as Partial<Agent> & { id: string };
      setAgents((prev) => {
        const idx = prev.findIndex((a) => a.id === data.id);
        if (idx === -1) {
          // New agent — fill in defaults for missing fields
          const agent: Agent = {
            id: data.id,
            type: data.type ?? 'orchestrator',
            status: data.status ?? 'idle',
            current_task: data.current_task,
            model: data.model ?? 'unknown',
            active_locks: data.active_locks ?? [],
            error: data.error,
          };
          return [...prev, agent];
        }
        const updated = [...prev];
        updated[idx] = { ...prev[idx]!, ...data };
        return updated;
      });
    }
  }, [lastEvent]);

  return { agents };
}
