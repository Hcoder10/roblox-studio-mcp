import type { ToolDefinition, ToolHandler, ToolContext } from '@roblox-studio-mcp/shared';
import { session_connect_input } from '@roblox-studio-mcp/shared';
import type { ServerToolContext } from '../context.js';

export const definition: ToolDefinition = {
  name: 'session_connect',
  description: 'Connect this MCP session to a Roblox Studio bridge session. If a token is provided, connects to that specific session. If only one studio session exists, auto-connects to it.',
  input_schema: session_connect_input,
  execution_layer: 'plugin',
  category: 'session',
  requires_session: false,
};

export const handler: ToolHandler = async (args: Record<string, unknown>, context: ToolContext) => {
  const ctx = context as ServerToolContext;
  const { token } = args as { token?: string };

  let session = token ? ctx.session_manager.get(token) : null;

  if (!session) {
    // Try auto-link if only one session or no token provided
    session = ctx.session_manager.get_single_session();
    if (!session) {
      return {
        success: false,
        error: {
          code: 'BRIDGE_NO_SESSION',
          message: token
            ? `No bridge session found with token "${token}". Make sure the Roblox Studio plugin is running.`
            : 'No bridge sessions available. Make sure the Roblox Studio plugin is running.',
          layer: 'bridge',
          tool: 'session_connect',
          retryable: true,
        },
      };
    }
  }

  ctx.session_manager.link_mcp_session(session.token);
  ctx.linked_session_token = session.token;

  return {
    success: true,
    data: {
      token: session.token,
      studio_version: session.studio_version,
      place_id: session.place_id,
      connected: true,
    },
  };
};
