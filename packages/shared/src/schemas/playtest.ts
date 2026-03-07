import { z } from 'zod';

export const playtest_start_input = z.object({
  mode: z.enum(['play', 'run', 'server']).optional().default('play'),
});

export const playtest_stop_input = z.object({});

export const playtest_get_status_input = z.object({});

export const playtest_simulate_input_input = z.object({
  input_type: z.enum(['key_press', 'key_release', 'mouse_click', 'mouse_move']),
  key: z.string().optional().describe('Key name for keyboard input'),
  position: z.object({ x: z.number(), y: z.number() }).optional().describe('Screen position for mouse input'),
  button: z.enum(['left', 'right', 'middle']).optional(),
});

export const playtest_get_player_input = z.object({
  player_index: z.number().int().min(0).optional().default(0),
});

export const playtest_get_output_log_input = z.object({
  max_lines: z.number().int().min(1).max(1000).optional().default(100),
  filter: z.enum(['all', 'output', 'warning', 'error']).optional().default('all'),
  since_timestamp: z.number().optional().describe('Only return messages after this timestamp'),
});

export const playtest_set_breakpoint_input = z.object({
  script_path: z.string(),
  line: z.number().int().min(1),
  condition: z.string().optional(),
});

export const playtest_remove_breakpoint_input = z.object({
  script_path: z.string(),
  line: z.number().int().min(1),
});

export const playtest_step_debugger_input = z.object({
  action: z.enum(['continue', 'step_over', 'step_into', 'step_out']),
});

export const playtest_get_call_stack_input = z.object({});

export const playtest_get_variables_input = z.object({
  scope: z.enum(['local', 'upvalue', 'global']).optional().default('local'),
  frame: z.number().int().min(0).optional().default(0),
});
