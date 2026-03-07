import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { execution_set_global_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'execution_set_global',
  description: 'Set a global variable in the plugin execution context.',
  input_schema: execution_set_global_input,
  execution_layer: 'plugin',
  category: 'execution',
  requires_session: true,
};

export const handler = create_plugin_handler('execution_set_global');
