import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { execution_get_globals_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'execution_get_globals',
  description: 'Get global variables available in the plugin execution context.',
  input_schema: execution_get_globals_input,
  execution_layer: 'plugin',
  category: 'execution',
  requires_session: true,
};

export const handler = create_plugin_handler('execution_get_globals');
