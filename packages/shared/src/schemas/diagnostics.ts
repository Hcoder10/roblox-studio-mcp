import { z } from 'zod';

export const diagnostics_get_stats_input = z.object({});

export const diagnostics_get_memory_input = z.object({
  detailed: z.boolean().optional().default(false),
});

export const diagnostics_get_network_stats_input = z.object({});

export const diagnostics_get_physics_stats_input = z.object({});

export const diagnostics_get_render_stats_input = z.object({});

export const diagnostics_profile_start_input = z.object({
  duration_seconds: z.number().positive().max(60).optional().default(5),
  categories: z.array(z.enum(['cpu', 'memory', 'network', 'physics', 'render'])).optional(),
});

export const diagnostics_profile_stop_input = z.object({});

export const diagnostics_profile_get_data_input = z.object({
  format: z.enum(['summary', 'detailed', 'json']).optional().default('summary'),
});

export const diagnostics_get_log_input = z.object({
  max_lines: z.number().int().min(1).max(5000).optional().default(200),
  level: z.enum(['all', 'info', 'warning', 'error']).optional().default('all'),
});

export const diagnostics_get_output_input = z.object({
  max_lines: z.number().int().min(1).max(5000).optional().default(200),
  filter: z.string().optional().describe('Filter output by pattern'),
});
