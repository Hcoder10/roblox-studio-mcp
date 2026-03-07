import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { terrain_clear_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'terrain_clear',
  description: 'Clear all terrain or a specific region.',
  input_schema: terrain_clear_input,
  execution_layer: 'plugin',
  category: 'terrain',
  requires_session: true,
};

export const handler = create_plugin_handler('terrain_clear');
