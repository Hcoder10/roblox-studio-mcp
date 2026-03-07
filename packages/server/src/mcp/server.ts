import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'crypto';
import type { Request, Response } from 'express';
import { register_all_tools } from '../tools/registry.js';
import type { ServerToolContext } from '../tools/context.js';
import { logger } from '../util/logger.js';

const transports = new Map<string, StreamableHTTPServerTransport>();

export function create_mcp_server(context: ServerToolContext): { mcp: McpServer; tool_count: number } {
  const mcp = new McpServer({
    name: 'roblox-studio-mcp',
    version: '1.0.0',
  });

  const tool_count = register_all_tools(mcp, context);
  return { mcp, tool_count };
}

export function create_mcp_handler(mcp: McpServer) {
  return async (req: Request, res: Response): Promise<void> => {
    const session_id = req.headers['mcp-session-id'] as string | undefined;

    if (session_id && transports.has(session_id)) {
      const transport = transports.get(session_id)!;
      await transport.handleRequest(req, res, req.body);
      return;
    }

    if (req.method === 'GET' || req.method === 'DELETE') {
      if (session_id && !transports.has(session_id)) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }
    }

    // New session
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
    });

    transport.onclose = () => {
      const id = transport.sessionId;
      if (id) {
        transports.delete(id);
        logger.debug({ session_id: id }, 'MCP transport closed');
      }
    };

    await mcp.connect(transport);

    if (transport.sessionId) {
      transports.set(transport.sessionId, transport);
      logger.debug({ session_id: transport.sessionId }, 'New MCP transport created');
    }

    await transport.handleRequest(req, res, req.body);
  };
}
