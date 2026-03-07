import { WebSocketServer, WebSocket } from 'ws';
import type { WsEvent } from '@roblox-studio-mcp/shared';
import type { Orchestrator } from '../orchestrator/orchestrator.js';
import type { AgentRegistry } from '../agents/agent_registry.js';
import type { LockManager } from '../locks/lock_manager.js';
import type { TaskQueue } from '../orchestrator/task_queue.js';
import pino from 'pino';

const logger = pino({ name: 'ws-handler' });

interface WsMessage {
  type: string;
  payload?: unknown;
}

export function setup_websocket(
  wss: WebSocketServer,
  orchestrator: Orchestrator,
  agent_registry: AgentRegistry,
  lock_manager: LockManager,
  task_queue: TaskQueue,
): void {
  const clients = new Set<WebSocket>();
  const serialize_agents = () =>
    agent_registry.list().map(a => ({
      id: a.id,
      type: a.definition.type,
      status: a.status,
      current_task: a.current_task_id,
      current_task_id: a.current_task_id,
      model: `${a.definition.model.provider}/${a.definition.model.model}`,
      active_locks: a.active_locks,
      error: a.error,
    }));

  function broadcast(event: WsEvent): void {
    const data = JSON.stringify(event);
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  wss.on('connection', (ws) => {
    clients.add(ws);
    logger.info({ clients: clients.size }, 'WebSocket client connected');

    // Send current state on connect
    const state_event: WsEvent = {
      type: 'agent_status_changed',
      payload: {
        agents: serialize_agents(),
        tasks: task_queue.list(),
        locks: lock_manager.list(),
      },
      timestamp: Date.now(),
    };
    ws.send(JSON.stringify(state_event));

    ws.on('message', async (raw) => {
      let msg: WsMessage;
      try {
        msg = JSON.parse(raw.toString()) as WsMessage;
      } catch {
        logger.warn('Received invalid JSON from WebSocket client');
        return;
      }

      switch (msg.type) {
        case 'user_message': {
          const payload = msg.payload as { text?: string; content?: string };
          const text = payload?.text ?? payload?.content;
          if (!text) {
            ws.send(JSON.stringify({
              type: 'error',
              payload: { message: 'Missing text in user_message' },
              timestamp: Date.now(),
            }));
            return;
          }

          try {
            await orchestrator.handle_user_message(text, broadcast);
          } catch (error) {
            ws.send(JSON.stringify({
              type: 'error',
              payload: { message: error instanceof Error ? error.message : 'Unknown error' },
              timestamp: Date.now(),
            }));
          }
          break;
        }

        case 'get_agents': {
          ws.send(JSON.stringify({
            type: 'agent_status_changed',
            payload: {
              agents: serialize_agents(),
            },
            timestamp: Date.now(),
          }));
          break;
        }

        case 'get_tasks': {
          ws.send(JSON.stringify({
            type: 'task_updated',
            payload: { tasks: task_queue.list() },
            timestamp: Date.now(),
          }));
          break;
        }

        case 'get_locks': {
          ws.send(JSON.stringify({
            type: 'lock_acquired',
            payload: lock_manager.list(),
            timestamp: Date.now(),
          }));
          break;
        }

        default:
          logger.debug({ type: msg.type }, 'Unknown WebSocket message type');
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      logger.info({ clients: clients.size }, 'WebSocket client disconnected');
    });

    ws.on('error', (error) => {
      logger.error({ error }, 'WebSocket client error');
      clients.delete(ws);
    });
  });
}
