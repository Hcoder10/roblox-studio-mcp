import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { terrain_get_material_colors_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'terrain_get_material_colors',
  description: 'Get the color overrides for each terrain material.',
  input_schema: terrain_get_material_colors_input,
  execution_layer: 'plugin',
  category: 'terrain',
  requires_session: true,
};

export const handler = create_plugin_handler('terrain_get_material_colors');
