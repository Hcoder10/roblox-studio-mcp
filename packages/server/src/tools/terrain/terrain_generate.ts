import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { terrain_generate_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'terrain_generate',
  description: 'Generate terrain with a specified biome, size, and optional seed.',
  input_schema: terrain_generate_input,
  execution_layer: 'plugin',
  category: 'terrain',
  requires_session: true,
};

export const handler = create_plugin_handler('terrain_generate');
