import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { terrain_read_voxels_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'terrain_read_voxels',
  description: 'Read terrain voxel data (materials and occupancies) from a region.',
  input_schema: terrain_read_voxels_input,
  execution_layer: 'plugin',
  category: 'terrain',
  requires_session: true,
};

export const handler = create_plugin_handler('terrain_read_voxels');
