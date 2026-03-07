import { z } from 'zod';
import { instance_path_schema, property_value_schema } from './common.js';

export const instance_create_input = z.object({
  class_name: z.string().describe('Roblox class name, e.g. "Part", "Model", "Folder"'),
  name: z.string().describe('Instance name'),
  parent_path: instance_path_schema.describe('Path to parent instance'),
  properties: z.record(property_value_schema).optional().describe('Initial properties to set'),
});

export const instance_delete_input = z.object({
  path: instance_path_schema.describe('Path to instance to delete'),
});

export const instance_clone_input = z.object({
  source_path: instance_path_schema.describe('Path to instance to clone'),
  target_parent_path: instance_path_schema.describe('Path to new parent'),
  new_name: z.string().optional().describe('Name for the clone'),
});

export const instance_move_input = z.object({
  path: instance_path_schema.describe('Path to instance to move'),
  new_parent_path: instance_path_schema.describe('Path to new parent'),
});

export const instance_get_input = z.object({
  path: instance_path_schema.describe('Path to instance'),
  depth: z.number().int().min(0).max(10).optional().default(1).describe('How many levels of children to include'),
});

export const instance_find_input = z.object({
  class_name: z.string().optional().describe('Filter by class name'),
  name: z.string().optional().describe('Filter by name (supports Lua patterns)'),
  root_path: instance_path_schema.optional().default('game').describe('Where to start searching'),
  recursive: z.boolean().optional().default(true),
  max_results: z.number().int().min(1).max(500).optional().default(50),
});

export const instance_set_property_input = z.object({
  path: instance_path_schema.describe('Path to instance'),
  property: z.string().describe('Property name'),
  value: property_value_schema.describe('Property value'),
});

export const instance_get_property_input = z.object({
  path: instance_path_schema.describe('Path to instance'),
  property: z.string().describe('Property name'),
});

export const instance_get_children_input = z.object({
  path: instance_path_schema.describe('Path to parent instance'),
  class_filter: z.string().optional().describe('Only return children of this class'),
});
