import { z } from 'zod';
import { instance_path_schema } from './common.js';

export const execution_echo_input = z.object({
  message: z.string().describe('Message to echo back'),
});

export const execution_run_luau_input = z.object({
  code: z.string().describe('Luau code to execute in Studio plugin context'),
  timeout_ms: z.number().int().min(100).max(30000).optional().default(10000),
});

export const execution_eval_expression_input = z.object({
  expression: z.string().describe('Luau expression to evaluate (must return a value)'),
});

export const execution_call_function_input = z.object({
  module_path: instance_path_schema.describe('Path to ModuleScript'),
  function_name: z.string().describe('Function name to call'),
  args: z.array(z.unknown()).optional().default([]),
});

export const execution_get_globals_input = z.object({
  filter: z.string().optional().describe('Filter globals by name pattern'),
});

export const execution_set_global_input = z.object({
  name: z.string().describe('Global variable name'),
  value: z.unknown().describe('Value to set'),
});

export const execution_require_module_input = z.object({
  path: instance_path_schema.describe('Path to ModuleScript to require'),
});
