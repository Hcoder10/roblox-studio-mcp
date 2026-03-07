import type { AgentMessage, AgentMessageType } from '@roblox-studio-mcp/shared';
import { v4 as uuid } from 'uuid';
import pino from 'pino';

const logger = pino({ name: 'message-bus' });

export class MessageBus {
  private handlers = new Map<string, Set<(msg: AgentMessage) => void>>();
  private history: AgentMessage[] = [];
  private max_history = 1000;

  subscribe(agent_id: string, handler: (msg: AgentMessage) => void): () => void {
    if (!this.handlers.has(agent_id)) {
      this.handlers.set(agent_id, new Set());
    }
    this.handlers.get(agent_id)!.add(handler);

    return () => {
      const handlers = this.handlers.get(agent_id);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.handlers.delete(agent_id);
        }
      }
    };
  }

  publish(message: AgentMessage): void {
    this.history.push(message);
    if (this.history.length > this.max_history) {
      this.history = this.history.slice(-this.max_history);
    }

    logger.debug(
      { from: message.from, to: message.to, type: message.type },
      'Message published',
    );

    const handlers = this.handlers.get(message.to);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(message);
        } catch (error) {
          logger.error({ error, message_id: message.id }, 'Message handler error');
        }
      }
    }
  }

  broadcast(from: string, type: AgentMessageType, payload: unknown): void {
    const targets = Array.from(this.handlers.keys()).filter(id => id !== from);
    for (const to of targets) {
      this.publish({
        id: uuid(),
        from,
        to,
        type,
        payload,
        timestamp: Date.now(),
      });
    }
  }

  get_history(agent_id: string, limit = 50): AgentMessage[] {
    return this.history
      .filter(m => m.from === agent_id || m.to === agent_id)
      .slice(-limit);
  }

  get_full_history(limit = 100): AgentMessage[] {
    return this.history.slice(-limit);
  }
}
