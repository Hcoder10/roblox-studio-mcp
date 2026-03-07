import { z } from 'zod';
import { instance_path_schema, udim2_schema, color3_schema } from './common.js';

export const ui_create_screen_gui_input = z.object({
  name: z.string(),
  parent_path: instance_path_schema.optional().default('StarterGui'),
  enabled: z.boolean().optional().default(true),
  reset_on_spawn: z.boolean().optional().default(true),
  display_order: z.number().int().optional().default(0),
  ignore_gui_inset: z.boolean().optional().default(false),
});

export const ui_create_element_input = z.object({
  class_name: z.enum([
    'Frame', 'TextLabel', 'TextButton', 'TextBox', 'ImageLabel',
    'ImageButton', 'ScrollingFrame', 'ViewportFrame', 'CanvasGroup',
    'VideoFrame', 'BillboardGui', 'SurfaceGui',
  ]),
  name: z.string(),
  parent_path: instance_path_schema,
  properties: z.record(z.unknown()).optional(),
});

export const ui_set_layout_input = z.object({
  parent_path: instance_path_schema,
  layout_type: z.enum(['UIListLayout', 'UIGridLayout', 'UIPageLayout', 'UITableLayout']),
  properties: z.record(z.unknown()).optional(),
});

export const ui_apply_style_input = z.object({
  path: instance_path_schema,
  style: z.object({
    background_color: color3_schema.optional(),
    background_transparency: z.number().min(0).max(1).optional(),
    border_color: color3_schema.optional(),
    border_size: z.number().int().min(0).optional(),
    size: udim2_schema.optional(),
    position: udim2_schema.optional(),
    anchor_point: z.object({ x: z.number(), y: z.number() }).optional(),
    text: z.string().optional(),
    text_color: color3_schema.optional(),
    text_size: z.number().positive().optional(),
    font: z.string().optional(),
    corner_radius: z.number().min(0).optional(),
    padding: z.object({
      top: z.number().optional(),
      bottom: z.number().optional(),
      left: z.number().optional(),
      right: z.number().optional(),
    }).optional(),
  }),
});

export const ui_create_template_input = z.object({
  name: z.string(),
  source_path: instance_path_schema.describe('Path to instance to save as template'),
});

export const ui_instantiate_template_input = z.object({
  template_name: z.string(),
  parent_path: instance_path_schema,
  overrides: z.record(z.unknown()).optional(),
});

export const ui_get_tree_input = z.object({
  root_path: instance_path_schema.optional().default('StarterGui'),
  depth: z.number().int().min(1).max(10).optional().default(5),
});

export const ui_preview_input = z.object({
  screen_gui_path: instance_path_schema.describe('Path to ScreenGui to preview'),
  resolution: z.object({ width: z.number().int(), height: z.number().int() }).optional(),
});
