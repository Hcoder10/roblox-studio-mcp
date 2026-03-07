import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { animation_import_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'animation_import',
  description: 'Import an animation from a Roblox asset ID.',
  input_schema: animation_import_input,
  execution_layer: 'plugin',
  category: 'animation',
  requires_session: true,
};

export const handler = create_plugin_handler('animation_import');
