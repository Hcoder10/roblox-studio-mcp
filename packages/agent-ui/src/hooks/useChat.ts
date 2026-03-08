import { useCallback, useEffect, useState } from 'react';
import type { AgentType, ChatMessage, ToolCall, WsEvent } from '../types';

let nextId = 1;
function makeId(): string {
  return `msg-${Date.now()}-${nextId++}`;
}

let nextToolId = 1;
function makeToolId(prefix: string): string {
  return `${prefix}-${Date.now()}-${nextToolId++}`;
}

export function useChat(
  lastEvent: WsEvent | null,
  send: (data: unknown) => void,
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thinkingAgents, setThinkingAgents] = useState<Set<string>>(
    () => new Set<string>(),
  );

  const sendUserMessage = useCallback(
    (content: string) => {
      const msg: ChatMessage = {
        id: makeId(),
        role: 'user',
        content,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, msg]);
      send({
        type: 'user_message',
        payload: { text: content, content },
        timestamp: Date.now(),
      });
    },
    [send],
  );

  useEffect(() => {
    if (!lastEvent) return;

    switch (lastEvent.type) {
      case 'agent_thinking': {
        const data = lastEvent.payload as { agent_id: string };
        setThinkingAgents((prev) => new Set(prev).add(data.agent_id));
        break;
      }

      case 'agent_message': {
        const data = lastEvent.payload as {
          agent_id: string;
          agent_type?: AgentType;
          text?: string;
          content: string;
          tool_calls?: ToolCall[];
        };
        setThinkingAgents((prev) => {
          const next = new Set(prev);
          next.delete(data.agent_id);
          return next;
        });
        const msg: ChatMessage = {
          id: makeId(),
          role: 'agent',
          agent_id: data.agent_id,
          agent_type: data.agent_type,
          content: data.content ?? data.text ?? '',
          tool_calls: data.tool_calls,
          timestamp: lastEvent.timestamp,
        };
        setMessages((prev) => [...prev, msg]);
        break;
      }

      case 'agent_tool_call': {
        const data = lastEvent.payload as {
          agent_id: string;
          agent_type?: AgentType;
          tool_name?: string;
          args?: Record<string, unknown>;
          tool_call_id?: string;
          tool_call?: Partial<ToolCall>;
        };
        if (!data.agent_id) break;

        const fallbackToolId = data.tool_call_id ?? makeToolId(data.agent_id);
        const normalizedToolCall: ToolCall = {
          id: data.tool_call?.id ?? fallbackToolId,
          tool_name: data.tool_call?.tool_name ?? data.tool_name ?? 'unknown',
          args: data.tool_call?.args ?? data.args ?? {},
          status: data.tool_call?.status ?? 'pending',
          result: data.tool_call?.result,
          duration_ms: data.tool_call?.duration_ms,
        };

        // Add tool call as a message or append to last agent message
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === 'agent' && last.agent_id === data.agent_id) {
            const updated = { ...last };
            updated.tool_calls = [...(updated.tool_calls ?? []), normalizedToolCall];
            return [...prev.slice(0, -1), updated];
          }
          // Create new agent message with tool call
          const msg: ChatMessage = {
            id: makeId(),
            role: 'agent',
            agent_id: data.agent_id,
            agent_type: data.agent_type,
            content: '',
            tool_calls: [normalizedToolCall],
            timestamp: lastEvent.timestamp,
          };
          return [...prev, msg];
        });
        break;
      }

      case 'agent_tool_result': {
        const data = lastEvent.payload as {
          agent_id: string;
          tool_call_id: string;
          tool_name?: string;
          result: unknown;
          status?: 'success' | 'error';
          success?: boolean;
          duration_ms?: number;
        };

        const status = data.status ?? (data.success === false ? 'error' : 'success');
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.agent_id !== data.agent_id || !msg.tool_calls) return msg;

            let matched = false;
            const updatedCalls = msg.tool_calls.map((tc) => {
              const matchesById = data.tool_call_id != null && tc.id === data.tool_call_id;
              const matchesByName =
                data.tool_call_id == null
                && !matched
                && data.tool_name != null
                && tc.tool_name === data.tool_name
                && tc.status === 'pending';

              if (!matchesById && !matchesByName) return tc;
              matched = true;
              return {
                ...tc,
                result: data.result,
                status,
                duration_ms: data.duration_ms ?? tc.duration_ms,
              };
            });
            return { ...msg, tool_calls: updatedCalls };
          }),
        );
        break;
      }

      case 'error': {
        const data = lastEvent.payload as { message?: string; error?: string };
        const content = data.message ?? data.error ?? 'Unknown error';
        const msg: ChatMessage = {
          id: makeId(),
          role: 'system',
          content,
          timestamp: lastEvent.timestamp,
        };
        setMessages((prev) => [...prev, msg]);
        break;
      }

      case 'agent_status_changed': {
        // Clear thinking indicator if an agent enters error/terminated state
        const data = lastEvent.payload as {
          agent_id?: string;
          id?: string;
          status?: string;
        };
        const agentId = data.agent_id ?? data.id;
        if (
          agentId &&
          (data.status === 'error' || data.status === 'terminated' || data.status === 'idle')
        ) {
          setThinkingAgents((prev) => {
            if (!prev.has(agentId)) return prev;
            const next = new Set(prev);
            next.delete(agentId);
            return next;
          });
        }
        break;
      }
    }
  }, [lastEvent]);

  return { messages, thinkingAgents, sendUserMessage };
}
