import { useEffect, useState } from 'react';
import type { Agent, WsEvent } from '../types';

interface BulkPayload {
  agents?: RawAgent[];
}

type RawAgent = Partial<Agent> & {
  id?: string;
  agent_id?: string;
  type?: Agent['type'];
  agent_type?: Agent['type'];
  current_task?: string | null;
  current_task_id?: string | null;
};

function toAgent(data: RawAgent): Agent | null {
  const id = data.id ?? data.agent_id;
  if (!id) return null;

  return {
    id,
    type: data.type ?? data.agent_type ?? 'orchestrator',
    status: data.status ?? 'idle',
    current_task: data.current_task ?? data.current_task_id ?? undefined,
    model: data.model ?? 'unknown',
    active_locks: data.active_locks ?? [],
    error: data.error,
  };
}

export function useAgents(lastEvent: WsEvent | null) {
  const [agents, setAgents] = useState<Agent[]>([]);

  // Fetch definitions from REST on mount so panel isn't empty
  useEffect(() => {
    fetch('http://localhost:3001/agents')
      .then((r) => r.json())
      .then((data: { definitions?: Array<{ id: string; type: string; model: string }> }) => {
        if (data.definitions) {
          setAgents(
            data.definitions.map((d) => ({
              id: d.id,
              type: d.type as Agent['type'],
              status: 'idle' as const,
              model: d.model,
              active_locks: [],
            })),
          );
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.type === 'agent_status_changed') {
      const payload = lastEvent.payload as BulkPayload | RawAgent;

      // Bulk format: { agents: [...] }
      if (payload && typeof payload === 'object' && 'agents' in payload && Array.isArray(payload.agents)) {
        setAgents(payload.agents.map(toAgent).filter((agent): agent is Agent => agent != null));
        return;
      }

      // Single agent update: { id, status, ... }
      const data = toAgent(payload as RawAgent);
      if (!data) return;

      setAgents((prev) => {
        const idx = prev.findIndex((a) => a.id === data.id);
        if (idx === -1) {
          return [...prev, data];
        }
        const updated = [...prev];
        updated[idx] = { ...prev[idx]!, ...data };
        return updated;
      });
    }
  }, [lastEvent]);

  return { agents };
}
