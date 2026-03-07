import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { terrain_fill_cylinder_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'terrain_fill_cylinder',
  description: 'Fill a cylindrical region with a terrain material.',
  input_schema: terrain_fill_cylinder_input,
  execution_layer: 'plugin',
  category: 'terrain',
  requires_session: true,
};

export const handler = create_plugin_handler('terrain_fill_cylinder');
