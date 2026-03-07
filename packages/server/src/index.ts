import express from 'express';
import { logger } from './util/logger.js';
import { create_health_handler } from './util/health.js';
import { error_handler } from './middleware/error_handler.js';
import { create_rate_limiter } from './middleware/rate_limiter.js';
import { SessionManager } from './bridge/session_manager.js';
import { CommandQueue } from './bridge/command_queue.js';
import { EventStream } from './bridge/event_stream.js';
import { create_bridge_router } from './bridge/routes.js';
import { create_tool_context } from './tools/context.js';
import { create_mcp_server, create_mcp_handler } from './mcp/server.js';

const PORT = parseInt(process.env.PORT || '3000', 10);

// Initialize infrastructure
const session_manager = new SessionManager();
const command_queue = new CommandQueue();
const event_stream = new EventStream();

// Create tool context
const tool_context = create_tool_context(command_queue, session_manager);

// Create MCP server with all tools
const { tool_count } = create_mcp_server(tool_context);

// Create Express app
const app = express();
app.use(express.json({ limit: '10mb' }));

// Rate limiters
app.use('/bridge', create_rate_limiter(100));
app.use('/mcp', create_rate_limiter(1000));

// Bridge routes
app.use('/bridge', create_bridge_router(session_manager, command_queue, event_stream));

// MCP Streamable HTTP transport
const mcp_handler = create_mcp_handler(tool_context);
app.all('/mcp', mcp_handler);

// Health check
app.get('/health', create_health_handler(session_manager, tool_count));

// Error handler (must be last)
app.use(error_handler);

// Start server
app.listen(PORT, () => {
  logger.info({ port: PORT, tools: tool_count }, 'Roblox Studio MCP server started');
});
