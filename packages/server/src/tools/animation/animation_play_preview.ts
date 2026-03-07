import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { animation_play_preview_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'animation_play_preview',
  description: 'Play a preview of an animation on a target character or model.',
  input_schema: animation_play_preview_input,
  execution_layer: 'plugin',
  category: 'animation',
  requires_session: true,
};

export const handler = create_plugin_handler('animation_play_preview');
