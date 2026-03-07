import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'crypto';
import type { Request, Response } from 'express';
import { register_all_tools } from '../tools/registry.js';
import type { ServerToolContext } from '../tools/context.js';
import { logger } from '../util/logger.js';

interface SessionRuntime {
  mcp: McpServer;
  transport: StreamableHTTPServerTransport;
}

const sessions = new Map<string, SessionRuntime>();

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
      await runtime.transport.handleRequest(req, res, req.body);
      return;
    }

    if (session_id && !sessions.has(session_id)) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // New session
    const { mcp } = build_mcp_server(context);
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
      sessions.set(transport.sessionId, { mcp, transport });
      logger.debug({ session_id: transport.sessionId }, 'New MCP transport created');
    }
  };
}
