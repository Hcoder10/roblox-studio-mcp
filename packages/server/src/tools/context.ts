import type { ToolContext } from '@roblox-studio-mcp/shared';
import type { CommandQueue } from '../bridge/command_queue.js';
import type { SessionManager } from '../bridge/session_manager.js';

export interface ServerToolContext extends ToolContext {
  session_manager: SessionManager;
  linked_session_token: string | null;
}

export function create_tool_context(
  command_queue: CommandQueue,
  session_manager: SessionManager,
): ServerToolContext {
  return {
    command_queue,
    session_manager,
    session_id: null,
    server_url: process.env.SERVER_URL || 'http://localhost:3000',
    linked_session_token: null,
  };
}
