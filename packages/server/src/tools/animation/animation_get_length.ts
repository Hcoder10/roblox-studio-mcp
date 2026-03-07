import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { animation_get_length_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'animation_get_length',
  description: 'Get the total length (duration in seconds) of a KeyframeSequence.',
  input_schema: animation_get_length_input,
  execution_layer: 'plugin',
  category: 'animation',
  requires_session: true,
};

export const handler = create_plugin_handler('animation_get_length');
