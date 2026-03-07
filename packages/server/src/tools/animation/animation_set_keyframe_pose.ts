import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { animation_set_keyframe_pose_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'animation_set_keyframe_pose',
  description: 'Set the pose (CFrame, easing, weight) for a body part at a specific keyframe.',
  input_schema: animation_set_keyframe_pose_input,
  execution_layer: 'plugin',
  category: 'animation',
  requires_session: true,
};

export const handler = create_plugin_handler('animation_set_keyframe_pose');
