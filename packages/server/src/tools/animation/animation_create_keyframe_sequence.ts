import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { animation_create_keyframe_sequence_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'animation_create_keyframe_sequence',
  description: 'Create a new KeyframeSequence for animation editing.',
  input_schema: animation_create_keyframe_sequence_input,
  execution_layer: 'plugin',
  category: 'animation',
  requires_session: true,
};

export const handler = create_plugin_handler('animation_create_keyframe_sequence');
