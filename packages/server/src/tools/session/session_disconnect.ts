import type { ToolDefinition, ToolHandler, ToolContext } from '@roblox-studio-mcp/shared';
import { session_disconnect_input } from '@roblox-studio-mcp/shared';
import type { ServerToolContext } from '../context.js';

export const definition: ToolDefinition = {
  name: 'session_disconnect',
  description: 'Disconnect the current MCP session from the Roblox Studio bridge session.',
  input_schema: session_disconnect_input,
  execution_layer: 'plugin',
  category: 'session',
  requires_session: false,
};

export const handler: ToolHandler = async (_args: Record<string, unknown>, context: ToolContext) => {
  const ctx = context as ServerToolContext;

  if (!ctx.linked_session_token) {
    return { success: true, data: { disconnected: true, was_connected: false } };
  }

  ctx.session_manager.unlink_mcp_session(ctx.linked_session_token);
  ctx.linked_session_token = null;

  return { success: true, data: { disconnected: true, was_connected: true } };
};
