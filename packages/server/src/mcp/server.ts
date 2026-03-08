import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'crypto';
import type { Request, Response } from 'express';
import { register_all_tools } from '../tools/registry.js';
import type { ServerToolContext } from '../tools/context.js';
import { create_session_tool_context } from '../tools/context.js';
import { logger } from '../util/logger.js';

interface SessionRuntime {
  mcp: McpServer;
  transport: StreamableHTTPServerTransport;
  context: ServerToolContext;
  last_activity: number;
}

const sessions = new Map<string, SessionRuntime>();

// GC stale MCP sessions every 5 minutes (handles clients that disconnect without closing)
const MCP_SESSION_TIMEOUT = 30 * 60_000; // 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, runtime] of sessions) {
    if (now - runtime.last_activity > MCP_SESSION_TIMEOUT) {
      sessions.delete(id);
      runtime.transport.close?.();
      logger.info({ session_id: id }, 'MCP session GC: expired stale session');
    }
  }
}, 5 * 60_000).unref();

function build_mcp_server(context: ServerToolContext): { mcp: McpServer; tool_count: number } {
  const mcp = new McpServer({
    name: 'roblox-studio-mcp',
    version: '1.0.0',
  });

  const tool_count = register_all_tools(mcp, context);
  return { mcp, tool_count };
}

export function create_mcp_server(context: ServerToolContext): { mcp: McpServer; tool_count: number } {
  return build_mcp_server(context);
}

export function create_mcp_handler(context: ServerToolContext) {
  return async (req: Request, res: Response): Promise<void> => {
    const session_id = req.headers['mcp-session-id'] as string | undefined;

    if (session_id && sessions.has(session_id)) {
      const runtime = sessions.get(session_id)!;
      runtime.last_activity = Date.now();
      await runtime.transport.handleRequest(req, res, req.body);
      return;
    }

    if (session_id && !sessions.has(session_id)) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // New session -- create an isolated context so concurrent MCP sessions
    // don't share mutable state (linked_session_token, etc.)
    const session_context = create_session_tool_context(context);
    const { mcp, tool_count } = build_mcp_server(session_context);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
    });

    transport.onclose = () => {
      const id = transport.sessionId;
      if (id) {
        sessions.delete(id);
        logger.debug({ session_id: id }, 'MCP transport closed');
      }
    };

    await mcp.connect(transport);

    await transport.handleRequest(req, res, req.body);

    if (transport.sessionId && !sessions.has(transport.sessionId)) {
      sessions.set(transport.sessionId, {
        mcp,
        transport,
        context: session_context,
        last_activity: Date.now(),
      });
      logger.debug({ session_id: transport.sessionId }, 'New MCP transport created');
    }
  };
}
