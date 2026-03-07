import { useCallback, useEffect, useState } from 'react';
import type { AgentType, ChatMessage, ToolCall, WsEvent } from '../types';

let nextId = 1;
function makeId(): string {
  return `msg-${Date.now()}-${nextId++}`;
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
      send({ type: 'user_message', payload: { content }, timestamp: Date.now() });
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
          content: data.content,
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
          tool_call: ToolCall;
        };
        // Add tool call as a message or append to last agent message
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === 'agent' && last.agent_id === data.agent_id) {
            const updated = { ...last };
            updated.tool_calls = [...(updated.tool_calls ?? []), data.tool_call];
            return [...prev.slice(0, -1), updated];
          }
          // Create new agent message with tool call
          const msg: ChatMessage = {
            id: makeId(),
            role: 'agent',
            agent_id: data.agent_id,
            agent_type: data.agent_type,
            content: '',
            tool_calls: [data.tool_call],
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
          result: unknown;
          status: 'success' | 'error';
          duration_ms: number;
        };
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.agent_id !== data.agent_id || !msg.tool_calls) return msg;
            const updatedCalls = msg.tool_calls.map((tc) =>
              tc.id === data.tool_call_id
                ? { ...tc, result: data.result, status: data.status, duration_ms: data.duration_ms }
                : tc,
            );
            return { ...msg, tool_calls: updatedCalls };
          }),
        );
        break;
      }

      case 'error': {
        const data = lastEvent.payload as { message: string };
        const msg: ChatMessage = {
          id: makeId(),
          role: 'system',
          content: data.message,
          timestamp: lastEvent.timestamp,
        };
        setMessages((prev) => [...prev, msg]);
        break;
      }
    }
  }, [lastEvent]);

  return { messages, thinkingAgents, sendUserMessage };
}
