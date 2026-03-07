import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { execution_call_function_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'execution_call_function',
  description: 'Call a function exported from a ModuleScript with the given arguments.',
  input_schema: execution_call_function_input,
  execution_layer: 'plugin',
  category: 'execution',
  requires_session: true,
};

export const handler = create_plugin_handler('execution_call_function');
