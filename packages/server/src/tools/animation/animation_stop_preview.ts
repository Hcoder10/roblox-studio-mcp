import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { animation_stop_preview_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'animation_stop_preview',
  description: 'Stop the currently playing animation preview.',
  input_schema: animation_stop_preview_input,
  execution_layer: 'plugin',
  category: 'animation',
  requires_session: true,
};

export const handler = create_plugin_handler('animation_stop_preview');
