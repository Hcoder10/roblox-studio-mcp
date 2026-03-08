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

/**
 * Create an isolated context for a single MCP session.
 * Shares command_queue and session_manager references (stateless singletons)
 * but gets its own linked_session_token so concurrent MCP sessions
 * don't overwrite each other's bridge link.
 */
export function create_session_tool_context(base: ServerToolContext): ServerToolContext {
  return {
    command_queue: base.command_queue,
    session_manager: base.session_manager,
    session_id: null,
    server_url: base.server_url,
    linked_session_token: null,
  };
}
