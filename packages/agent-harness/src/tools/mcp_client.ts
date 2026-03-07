import type { ToolResponse } from '@roblox-studio-mcp/shared';
import type { ToolDefinition } from '../agents/types.js';
import pino from 'pino';

const logger = pino({ name: 'mcp-client' });

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

export class McpClient {
  private server_url: string;
  private session_id: string | null = null;
  private request_id = 0;
  private tool_definitions: ToolDefinition[] = [];

  constructor(server_url: string) {
    // Remove trailing slash
    this.server_url = server_url.replace(/\/$/, '');
  }

  async initialize(): Promise<void> {
    const response = await this.send_rpc('initialize', {
      protocolVersion: '2025-03-26',
      capabilities: {},
      clientInfo: { name: 'agent-harness', version: '1.0.0' },
    });

    logger.info({ capabilities: response }, 'MCP session initialized');

    // Send initialized notification
    await this.send_notification('notifications/initialized', {});
  }

  async list_tools(): Promise<ToolDefinition[]> {
    const response = await this.send_rpc('tools/list', {}) as {
      tools: Array<{
        name: string;
        description: string;
        inputSchema: Record<string, unknown>;
      }>;
    };

    this.tool_definitions = response.tools.map(t => ({
      name: t.name,
      description: t.description,
      parameters: t.inputSchema,
    }));

    logger.info({ count: this.tool_definitions.length }, 'Tools loaded from MCP server');
    return this.tool_definitions;
  }

  get_tool_definitions(): ToolDefinition[] {
    return this.tool_definitions;
  }

  async call_tool(name: string, args: Record<string, unknown>): Promise<ToolResponse> {
    try {
      const result = await this.send_rpc('tools/call', {
        name,
        arguments: args,
      }) as { content: Array<{ type: string; text?: string }>; isError?: boolean };

      if (result.isError) {
        const error_text = result.content
          .filter(c => c.type === 'text')
          .map(c => c.text)
          .join('\n');

        return {
          success: false,
          error: {
            code: 'PLUGIN_EXECUTION_FAILED',
            message: error_text || 'Tool call failed',
            layer: 'server',
            tool: name,
            retryable: false,
          },
        };
      }

      const text_content = result.content
        .filter(c => c.type === 'text')
        .map(c => c.text)
        .join('\n');

      let data: unknown;
      try {
        data = JSON.parse(text_content);
      } catch {
        data = text_content;
      }

      return { success: true, data };
    } catch (error) {
      logger.error({ error, tool: name }, 'MCP tool call failed');
      return {
        success: false,
        error: {
          code: 'SERVER_INTERNAL',
          message: error instanceof Error ? error.message : 'Unknown error',
          layer: 'server',
          tool: name,
          retryable: true,
        },
      };
    }
  }

  private async send_rpc(method: string, params: Record<string, unknown>): Promise<unknown> {
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: ++this.request_id,
      method,
      params,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    };

    if (this.session_id) {
      headers['mcp-session-id'] = this.session_id;
    }

    const response = await fetch(`${this.server_url}/mcp`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    // Store session ID from response
    const returned_session = response.headers.get('mcp-session-id');
    if (returned_session) {
      this.session_id = returned_session;
    }

    const content_type = response.headers.get('content-type') ?? '';

    if (content_type.includes('text/event-stream')) {
      return this.parse_sse_response(response);
    }

    if (!response.ok) {
      throw new Error(`MCP server returned ${response.status}: ${await response.text()}`);
    }

    const json_response = (await response.json()) as JsonRpcResponse;

    if (json_response.error) {
      throw new Error(`MCP error ${json_response.error.code}: ${json_response.error.message}`);
    }

    return json_response.result;
  }

  private async send_notification(method: string, params: Record<string, unknown>): Promise<void> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    };

    if (this.session_id) {
      headers['mcp-session-id'] = this.session_id;
    }

    const response = await fetch(`${this.server_url}/mcp`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        method,
        params,
      }),
    });

    if (!response.ok) {
      throw new Error(`MCP notification ${method} failed: ${response.status} ${await response.text()}`);
    }
  }

  private async parse_sse_response(response: Response): Promise<unknown> {
    const text = await response.text();
    const lines = text.split('\n');
    let last_data = '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        last_data = line.slice(6);
      }
    }

    if (!last_data) {
      throw new Error('No data in SSE response');
    }

    const json_response = JSON.parse(last_data) as JsonRpcResponse;

    if (json_response.error) {
      throw new Error(`MCP error ${json_response.error.code}: ${json_response.error.message}`);
    }

    return json_response.result;
  }
}
