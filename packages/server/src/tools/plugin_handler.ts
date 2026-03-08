import { randomUUID } from 'crypto';
import type { CommandEnvelope, ToolResponse, ToolHandler, ToolContext } from '@roblox-studio-mcp/shared';
import { TIMEOUTS } from '@roblox-studio-mcp/shared';
import type { ServerToolContext } from './context.js';

export function create_plugin_handler(tool_name: string, timeout_ms = TIMEOUTS.PLUGIN_COMMAND): ToolHandler {
  return async (args: Record<string, unknown>, context: ToolContext): Promise<ToolResponse> => {
    const ctx = context as ServerToolContext;
    if (!ctx.linked_session_token) {
      return {
        success: false,
        error: {
          code: 'BRIDGE_NO_SESSION',
          message: 'No bridge session linked. Use session_connect first.',
          layer: 'bridge',
          tool: tool_name,
          retryable: false,
        },
      };
    }

    const command: CommandEnvelope = {
      id: randomUUID(),
      tool: tool_name,
      args,
      timestamp: Date.now(),
      timeout_ms,
    };

    try {
      const result = await ctx.command_queue.enqueue(command, ctx.linked_session_token);
      return result.success
        ? { success: true, data: result.result }
        : {
            success: false,
            error: {
              code: 'PLUGIN_EXECUTION_FAILED',
              message: result.error_message || 'Unknown plugin error',
              layer: 'plugin',
              tool: tool_name,
              retryable: false,
            },
          };
    } catch (err) {
      return {
        success: false,
        error: {
          code: 'BRIDGE_TIMEOUT',
          message: err instanceof Error ? err.message : 'Command failed',
          layer: 'bridge',
          tool: tool_name,
          retryable: true,
        },
      };
    }
  };
}
