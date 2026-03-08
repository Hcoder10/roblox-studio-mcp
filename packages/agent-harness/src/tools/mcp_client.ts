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
  private initialized = false;
  private initializing: Promise<void> | null = null;

  constructor(server_url: string) {
    // Remove trailing slash
    this.server_url = server_url.replace(/\/$/, '');
  }

  async initialize(): Promise<void> {
    // Reset session for fresh connection
    this.session_id = null;

    const response = await this.send_rpc('initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'agent-harness', version: '1.0.0' },
    });

    logger.info({ capabilities: response }, 'MCP session initialized');

    // Send initialized notification
    await this.send_notification('notifications/initialized', {});
    this.initialized = true;
  }

  /** Ensure MCP client is initialized, with retry logic. */
  async ensure_initialized(): Promise<void> {
    if (this.initialized && this.tool_definitions.length > 0) return;

    // Prevent concurrent initialization attempts
    if (this.initializing) {
      await this.initializing;
      return;
    }

    this.initializing = (async () => {
      const max_retries = 3;
      for (let attempt = 1; attempt <= max_retries; attempt++) {
        try {
          // Reset session state for fresh attempt
          this.session_id = null;
          this.initialized = false;

          await this.initialize();
          await this.list_tools();

          // Auto-link to the Roblox Studio bridge session so plugin tools work
          await this.auto_connect_session();

          logger.info({ tools: this.tool_definitions.length, attempt }, 'MCP client initialized on demand');
          return;
        } catch (error) {
          logger.warn({ error, attempt, max_retries }, 'MCP initialization attempt failed');
          if (attempt < max_retries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }
      throw new Error(`Failed to initialize MCP client after ${max_retries} attempts`);
    })();

    try {
      await this.initializing;
    } finally {
      this.initializing = null;
    }
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
      // Lazy-init: ensure we have a valid MCP session before calling tools
      await this.ensure_initialized();
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

  /**
   * Call session_connect (no token) to auto-link this MCP session
   * to the single active Roblox Studio bridge session.
   * Public alias for use during startup; also called internally during ensure_initialized.
   */
  async connect_to_bridge(): Promise<void> {
    return this.auto_connect_session();
  }

  private async auto_connect_session(): Promise<void> {
    try {
      const result = await this.send_rpc('tools/call', {
        name: 'session_connect',
        arguments: {},
      }) as { content: Array<{ type: string; text?: string }>; isError?: boolean };

      if (result.isError) {
        const msg = result.content?.map(c => c.text).join(' ') ?? 'unknown';
        logger.warn({ msg }, 'session_connect failed — plugin may not be running yet');
      } else {
        const text = result.content?.find(c => c.type === 'text')?.text ?? '';
        logger.info({ text: text.slice(0, 200) }, 'Auto-linked to bridge session');
      }
    } catch (error) {
      // Non-fatal: agents can still use cloud-only tools
      logger.warn({ error }, 'session_connect call failed — plugin tools will not work until Studio connects');
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

    // BUG FIX: Check HTTP status before content-type to handle error responses
    // with SSE content types correctly
    if (!response.ok) {
      throw new Error(`MCP server returned ${response.status}: ${await response.text()}`);
    }

    const content_type = response.headers.get('content-type') ?? '';

    if (content_type.includes('text/event-stream')) {
      return this.parse_sse_response(response);
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
    // BUG FIX: Accumulate multi-line data fields per SSE event correctly.
    // Each blank line terminates an event. We want the last complete event's data.
    let current_data_lines: string[] = [];
    let last_complete_data = '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        current_data_lines.push(line.slice(6));
      } else if (line.startsWith('data:')) {
        // "data:" with no space = empty data line
        current_data_lines.push(line.slice(5));
      } else if (line.trim() === '' && current_data_lines.length > 0) {
        // Blank line terminates an SSE event
        last_complete_data = current_data_lines.join('\n');
        current_data_lines = [];
      }
    }

    // Handle case where stream ends without trailing blank line
    if (current_data_lines.length > 0) {
      last_complete_data = current_data_lines.join('\n');
    }

    if (!last_complete_data) {
      throw new Error('No data in SSE response');
    }

    const json_response = JSON.parse(last_complete_data) as JsonRpcResponse;

    if (json_response.error) {
      throw new Error(`MCP error ${json_response.error.code}: ${json_response.error.message}`);
    }

    return json_response.result;
  }
}
