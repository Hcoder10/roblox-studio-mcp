import { useEffect, useState } from 'react';
import type { AgentAction, AgentType, WsEvent } from '../types';

let nextActionId = 1;

export function useAgentActions(lastEvent: WsEvent | null) {
  const [actions, setActions] = useState<AgentAction[]>([]);

  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.type === 'agent_action') {
      const data = lastEvent.payload as Partial<AgentAction>;
      if (!data.agent_id) return;

      const action: AgentAction = {
        id: data.id ?? `action-${nextActionId++}`,
        agent_id: data.agent_id,
        agent_type: data.agent_type ?? 'orchestrator',
        action: data.action ?? data.tool_name ?? 'unknown',
        tool_name: data.tool_name,
        tool_args: data.tool_args,
        result: data.result,
        status: data.status ?? 'started',
        timestamp: data.timestamp ?? lastEvent.timestamp,
        duration_ms: data.duration_ms,
      };

      setActions((prev) => [...prev.slice(-499), action]);
    }

    // Also track tool calls as actions
    if (lastEvent.type === 'agent_tool_call') {
      const data = lastEvent.payload as {
        agent_id?: string;
        agent_type?: AgentType;
        tool_name?: string;
        args?: Record<string, unknown>;
        tool_call?: { tool_name?: string; args?: Record<string, unknown> };
      };
      if (!data.agent_id) return;

      const action: AgentAction = {
        id: `action-${nextActionId++}`,
        agent_id: data.agent_id,
        agent_type: data.agent_type ?? 'orchestrator',
        action: data.tool_call?.tool_name ?? data.tool_name ?? 'tool_call',
        tool_name: data.tool_call?.tool_name ?? data.tool_name,
        tool_args: data.tool_call?.args ?? data.args,
        status: 'started',
        timestamp: lastEvent.timestamp,
      };

      setActions((prev) => [...prev.slice(-499), action]);
    }

    if (lastEvent.type === 'agent_tool_result') {
      const data = lastEvent.payload as {
        agent_id?: string;
        agent_type?: AgentType;
        tool_name?: string;
        tool_call_id?: string;
        status?: string;
        success?: boolean;
        duration_ms?: number;
        result?: unknown;
      };
      if (!data.agent_id) return;

      const status = data.status === 'error' || data.success === false ? 'error' : 'completed';
      const action: AgentAction = {
        id: `action-${nextActionId++}`,
        agent_id: data.agent_id,
        agent_type: data.agent_type ?? 'orchestrator',
        action: data.tool_name ?? 'tool_result',
        tool_name: data.tool_name,
        result: typeof data.result === 'string' ? data.result : JSON.stringify(data.result),
        status,
        timestamp: lastEvent.timestamp,
        duration_ms: data.duration_ms,
      };

      setActions((prev) => [...prev.slice(-499), action]);
    }
  }, [lastEvent]);

  return { actions };
}
