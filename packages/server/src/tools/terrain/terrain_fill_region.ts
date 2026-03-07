import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { terrain_fill_region_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'terrain_fill_region',
  description: 'Fill a rectangular region with a terrain material.',
  input_schema: terrain_fill_region_input,
  execution_layer: 'plugin',
  category: 'terrain',
  requires_session: true,
};

export const handler = create_plugin_handler('terrain_fill_region');
