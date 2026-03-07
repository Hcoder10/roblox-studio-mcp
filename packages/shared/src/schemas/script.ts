import { z } from 'zod';
import { instance_path_schema } from './common.js';

export const script_create_input = z.object({
  class_name: z.enum(['Script', 'LocalScript', 'ModuleScript']),
  name: z.string(),
  parent_path: instance_path_schema,
  source: z.string().optional().default(''),
  enabled: z.boolean().optional().default(true),
});

export const script_get_source_input = z.object({
  path: instance_path_schema.describe('Path to script'),
});

export const script_set_source_input = z.object({
  path: instance_path_schema.describe('Path to script'),
  source: z.string().describe('New Luau source code'),
});

export const script_find_input = z.object({
  pattern: z.string().optional().describe('Search pattern in source code'),
  class_name: z.enum(['Script', 'LocalScript', 'ModuleScript']).optional(),
  root_path: instance_path_schema.optional().default('game'),
  max_results: z.number().int().min(1).max(200).optional().default(50),
});

export const script_list_input = z.object({
  root_path: instance_path_schema.optional().default('game'),
  class_name: z.enum(['Script', 'LocalScript', 'ModuleScript']).optional(),
  recursive: z.boolean().optional().default(true),
});

export const script_require_graph_input = z.object({
  path: instance_path_schema.describe('Path to script to analyze'),
  depth: z.number().int().min(1).max(10).optional().default(3),
});

export const script_insert_snippet_input = z.object({
  path: instance_path_schema.describe('Path to script'),
  line: z.number().int().min(1).describe('Line number to insert at'),
  code: z.string().describe('Code to insert'),
});

export const script_replace_section_input = z.object({
  path: instance_path_schema.describe('Path to script'),
  start_line: z.number().int().min(1),
  end_line: z.number().int().min(1),
  code: z.string().describe('Replacement code'),
});

export const script_validate_syntax_input = z.object({
  source: z.string().describe('Luau source code to validate'),
});
