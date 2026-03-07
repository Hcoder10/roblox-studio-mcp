import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { animation_add_keyframe_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'animation_add_keyframe',
  description: 'Add a keyframe at a specific time in a KeyframeSequence.',
  input_schema: animation_add_keyframe_input,
  execution_layer: 'plugin',
  category: 'animation',
  requires_session: true,
};

export const handler = create_plugin_handler('animation_add_keyframe');
