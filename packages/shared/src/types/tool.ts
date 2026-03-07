import type { ZodType } from 'zod';
import type { CommandEnvelope, CommandResult } from './bridge.js';

export type ExecutionLayer = 'plugin' | 'cloud' | 'hybrid';

export type ToolCategory =
  | 'instance'
  | 'script'
  | 'execution'
  | 'playtest'
  | 'terrain'
  | 'animation'
  | 'diagnostics'
  | 'ui_builder'
  | 'record_replay'
  | 'cloud_api'
  | 'luau_parser'
  | 'session';

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: ZodType;
  output_schema?: ZodType;
  execution_layer: ExecutionLayer;
  category: ToolCategory;
  requires_session: boolean;
}

export interface ToolResult<T = unknown> {
  success: true;
  data: T;
}

export interface ToolError {
  success: false;
  error: StructuredError;
}

export type ToolResponse<T = unknown> = ToolResult<T> | ToolError;

export interface ToolHandler {
  (args: Record<string, unknown>, context: ToolContext): Promise<ToolResponse>;
}

export interface ToolContext {
  command_queue: CommandQueueInterface;
  session_id: string | null;
  server_url: string;
}

export interface CommandQueueInterface {
  enqueue(command: CommandEnvelope): Promise<CommandResult>;
}

export interface StructuredError {
  code: string;
  message: string;
  layer: 'server' | 'bridge' | 'plugin' | 'cloud_api';
  tool?: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}

export interface ToolModule {
  definition: ToolDefinition;
  handler: ToolHandler;
}
