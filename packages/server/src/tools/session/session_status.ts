import type { ToolDefinition, ToolHandler, ToolContext } from '@roblox-studio-mcp/shared';
import { session_status_input } from '@roblox-studio-mcp/shared';
import type { ServerToolContext } from '../context.js';

export const definition: ToolDefinition = {
  name: 'session_status',
  description: 'Get the current session status including connection state, plugin version, and place information.',
  input_schema: session_status_input,
  execution_layer: 'plugin',
  category: 'session',
  requires_session: false,
};

export const handler: ToolHandler = async (_args: Record<string, unknown>, context: ToolContext) => {
  const ctx = context as ServerToolContext;

  if (!ctx.linked_session_token) {
    return {
      success: true,
      data: {
        connected: false,
        available_sessions: ctx.session_manager.list().map((s) => ({
          token: s.token,
          studio_version: s.studio_version,
          place_id: s.place_id,
          age_ms: Date.now() - s.created_at,
        })),
      },
    };
  }

  const session = ctx.session_manager.get(ctx.linked_session_token);
  if (!session) {
    ctx.linked_session_token = null;
    return { success: true, data: { connected: false, available_sessions: [] } };
  }

  return {
    success: true,
    data: {
      connected: true,
      token: session.token,
      studio_version: session.studio_version,
      place_id: session.place_id,
      session_age_ms: Date.now() - session.created_at,
      last_heartbeat_ms: Date.now() - session.last_heartbeat,
    },
  };
};
