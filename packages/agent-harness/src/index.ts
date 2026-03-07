import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import pino from 'pino';
import { AgentRegistry } from './agents/agent_registry.js';
import { LockManager } from './locks/lock_manager.js';
import { MessageBus } from './messages/message_bus.js';
import { TaskQueue } from './orchestrator/task_queue.js';
import { McpClient } from './tools/mcp_client.js';
import { ModelFactory } from './models/model_factory.js';
import { Orchestrator } from './orchestrator/orchestrator.js';
import { setup_websocket } from './ui/ws_handler.js';
import { get_default_definitions } from './config/agent_config.js';

const logger = pino({ name: 'agent-harness' });

const PORT = parseInt(process.env.AGENT_PORT ?? process.env.PORT ?? '3001', 10);
const MCP_SERVER_URL = process.env.MCP_SERVER_URL ?? 'http://localhost:3000';

async function main(): Promise<void> {
  logger.info({ port: PORT, mcp_server: MCP_SERVER_URL }, 'Starting agent harness');

  // Initialize core components
  const agent_registry = new AgentRegistry();
  const lock_manager = new LockManager();
  const message_bus = new MessageBus();
  const task_queue = new TaskQueue();
  const model_factory = new ModelFactory();
  const mcp_client = new McpClient(MCP_SERVER_URL);

  // Register default agent definitions
  for (const def of get_default_definitions()) {
    agent_registry.register_definition(def);
  }

  // Initialize MCP connection
  try {
    await mcp_client.initialize();
    await mcp_client.list_tools();
    logger.info('MCP client initialized and tools loaded');
  } catch (error) {
    logger.warn({ error }, 'Could not initialize MCP client - will retry on first request');
  }

  // Create orchestrator
  const orchestrator = new Orchestrator(
    agent_registry,
    lock_manager,
    message_bus,
    task_queue,
    mcp_client,
    model_factory,
  );

  // Express app
  const app = express();
  app.use(express.json());

  // CORS middleware
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (_req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  // Chat endpoint (alternative to WebSocket)
  app.post('/chat', async (req, res) => {
    const { message } = req.body as { message?: string };
    if (!message) {
      res.status(400).json({ error: 'Missing message field' });
      return;
    }

    try {
      // No-op broadcast for HTTP mode
      const events: unknown[] = [];
      const response = await orchestrator.handle_user_message(message, (event) => {
        events.push(event);
      });

      res.json({ response, events });
    } catch (error) {
      logger.error({ error }, 'Chat request failed');
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal error',
      });
    }
  });

  // Agent listing
  app.get('/agents', (_req, res) => {
    res.json({
      definitions: agent_registry.get_definitions().map(d => ({
        id: d.id,
        type: d.type,
        model: `${d.model.provider}/${d.model.model}`,
        allowed_tools_count: d.allowed_tools.length,
        allowed_categories: d.allowed_categories,
      })),
      instances: agent_registry.list().map(a => ({
        id: a.id,
        type: a.definition.type,
        status: a.status,
        current_task_id: a.current_task_id,
      })),
    });
  });

  // Task listing
  app.get('/tasks', (_req, res) => {
    res.json({
      tasks: task_queue.list(),
      summary: {
        total: task_queue.list().length,
        pending: task_queue.get_pending().length,
        ready: task_queue.get_ready().length,
        blocked: task_queue.get_blocked().length,
      },
    });
  });

  // Lock listing
  app.get('/locks', (_req, res) => {
    res.json(lock_manager.list());
  });

  // Create HTTP server
  const server = createServer(app);

  // WebSocket setup
  const wss = new WebSocketServer({ server });
  setup_websocket(wss, orchestrator, agent_registry, lock_manager, task_queue);

  // Start listening
  server.listen(PORT, () => {
    logger.info({ port: PORT }, 'Agent harness server running');
    logger.info(`  HTTP:  http://localhost:${PORT}`);
    logger.info(`  WS:    ws://localhost:${PORT}`);
    logger.info(`  MCP:   ${MCP_SERVER_URL}`);
  });

  // Graceful shutdown
  const shutdown = () => {
    logger.info('Shutting down...');
    lock_manager.destroy();
    wss.close();
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  logger.fatal({ error }, 'Fatal error');
  process.exit(1);
});

