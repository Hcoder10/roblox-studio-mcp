import type {
  AgentDefinition,
  AgentInstance,
  AgentTask,
  WsEvent,
  ToolResponse,
} from '@roblox-studio-mcp/shared';
import type { McpClient } from '../tools/mcp_client.js';
import type { ToolProxy } from '../tools/tool_proxy.js';
import type { LockManager } from '../locks/lock_manager.js';
import type { MessageBus } from '../messages/message_bus.js';
import type { TaskQueue } from '../orchestrator/task_queue.js';

export interface AgentRunContext {
  agent: AgentInstance;
  mcp_client: McpClient;
  tool_proxy: ToolProxy;
  lock_manager: LockManager;
  message_bus: MessageBus;
  task_queue: TaskQueue;
  ws_broadcast: (event: WsEvent) => void;
}

export interface ToolCallRequest {
  tool_name: string;
  args: Record<string, unknown>;
}

export interface AgentTurn {
  thinking?: string;
  text?: string;
  tool_calls: ToolCallRequest[];
  model_parts?: MessagePart[];
  done: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface Message {
  role: 'user' | 'model' | 'tool';
  parts: MessagePart[];
}

export type MessagePart =
  | { raw: Record<string, unknown> }
  | { text: string }
  | { functionCall: { name: string; args: Record<string, unknown> } }
  | { functionResponse: { name: string; response: Record<string, unknown> } }
  | { thought: true; text: string };

export interface AgentHooks {
  /** Called before each LLM generation turn. Can inject context or modify state. */
  before_turn?: (context: AgentRunContext) => Promise<void>;
  /** Called after each LLM turn completes. Can log, validate, or trigger side effects. */
  after_turn?: (context: AgentRunContext, result: AgentTurn) => Promise<void>;
  /** Called before a tool is executed. Can modify args. Return the (possibly modified) args. */
  before_tool_call?: (tool_name: string, args: Record<string, unknown>) => Promise<Record<string, unknown>>;
  /** Called after a tool returns. Can log results, track created instances, etc. */
  after_tool_call?: (tool_name: string, result: unknown) => Promise<void>;
  /** Called when an error occurs. Return 'retry' to retry the turn, 'skip' to continue, 'abort' to fail the task. */
  on_error?: (error: Error) => Promise<'retry' | 'skip' | 'abort'>;
}

export interface GenerativeModelClient {
  generate(
    system_prompt: string,
    tools: ToolDefinition[],
    history: Message[],
  ): Promise<AgentTurn>;
}

export { AgentDefinition, AgentInstance, AgentTask, WsEvent, ToolResponse };
