import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { animation_remove_keyframe_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'animation_remove_keyframe',
  description: 'Remove a keyframe from a KeyframeSequence by name or index.',
  input_schema: animation_remove_keyframe_input,
  execution_layer: 'plugin',
  category: 'animation',
  requires_session: true,
};

export const handler = create_plugin_handler('animation_remove_keyframe');
