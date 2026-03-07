import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { script_list_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'script_list',
  description: 'List all scripts in the DataModel, optionally filtered by type and root path.',
  input_schema: script_list_input,
  execution_layer: 'plugin',
  category: 'script',
  requires_session: true,
};

export const handler = create_plugin_handler('script_list');
