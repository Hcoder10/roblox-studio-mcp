import { z } from 'zod';
import { instance_path_schema, cframe_schema } from './common.js';

export const animation_create_keyframe_sequence_input = z.object({
  name: z.string(),
  parent_path: instance_path_schema.optional().default('Workspace'),
  loop: z.boolean().optional().default(false),
  priority: z.enum(['Idle', 'Movement', 'Action', 'Core']).optional().default('Action'),
});

export const animation_add_keyframe_input = z.object({
  sequence_path: instance_path_schema,
  time: z.number().min(0).describe('Time in seconds'),
  name: z.string().optional(),
});

export const animation_remove_keyframe_input = z.object({
  sequence_path: instance_path_schema,
  keyframe_name: z.string().optional(),
  keyframe_index: z.number().int().min(0).optional(),
}).refine(
  (d) => d.keyframe_name !== undefined || d.keyframe_index !== undefined,
  { message: 'Must provide keyframe_name or keyframe_index' },
);

export const animation_set_keyframe_pose_input = z.object({
  sequence_path: instance_path_schema,
  keyframe_index: z.number().int().min(0),
  part_name: z.string().describe('Body part name (e.g. "RightArm", "Head")'),
  cframe: cframe_schema,
  easing_style: z.enum(['Linear', 'Cubic', 'Elastic', 'Bounce', 'Constant']).optional().default('Linear'),
  easing_direction: z.enum(['In', 'Out', 'InOut']).optional().default('InOut'),
  weight: z.number().min(0).max(1).optional().default(1),
});

export const animation_play_preview_input = z.object({
  sequence_path: instance_path_schema,
  target_path: instance_path_schema.describe('Path to character/model to animate'),
  speed: z.number().positive().optional().default(1),
});

export const animation_stop_preview_input = z.object({});

export const animation_import_input = z.object({
  asset_id: z.string().describe('Roblox asset ID for the animation'),
  name: z.string().optional(),
  parent_path: instance_path_schema.optional().default('Workspace'),
});

export const animation_export_input = z.object({
  sequence_path: instance_path_schema,
  format: z.enum(['rbxmx', 'json']).optional().default('json'),
});

export const animation_get_length_input = z.object({
  sequence_path: instance_path_schema,
});

export const animation_list_input = z.object({
  root_path: instance_path_schema.optional().default('game'),
  recursive: z.boolean().optional().default(true),
});
