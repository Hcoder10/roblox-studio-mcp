import { z } from 'zod';

export const luau_parse_input = z.object({
  source: z.string().describe('Luau source code to parse'),
});

export const luau_analyze_input = z.object({
  source: z.string().describe('Luau source code to analyze'),
  checks: z.array(z.enum([
    'type_errors', 'unused_variables', 'unreachable_code',
    'deprecated_api', 'performance', 'style',
  ])).optional(),
});

export const luau_format_input = z.object({
  source: z.string().describe('Luau source code to format'),
  indent_width: z.number().int().min(1).max(8).optional().default(4),
  use_tabs: z.boolean().optional().default(true),
  column_width: z.number().int().min(40).max(200).optional().default(120),
});

export const luau_lint_input = z.object({
  source: z.string().describe('Luau source code to lint'),
  rules: z.array(z.string()).optional().describe('Specific lint rules to check'),
});

export const luau_get_ast_input = z.object({
  source: z.string().describe('Luau source code to parse into AST'),
  include_comments: z.boolean().optional().default(false),
  include_locations: z.boolean().optional().default(true),
});

export const luau_transform_input = z.object({
  source: z.string().describe('Luau source code to transform'),
  transforms: z.array(z.enum([
    'minify', 'rename_locals', 'dead_code_elimination',
    'constant_folding', 'inline_requires',
  ])),
});
