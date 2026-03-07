import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { script_get_source_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'script_get_source',
  description: 'Get the Luau source code of a script.',
  input_schema: script_get_source_input,
  execution_layer: 'plugin',
  category: 'script',
  requires_session: true,
};

export const handler = create_plugin_handler('script_get_source');
