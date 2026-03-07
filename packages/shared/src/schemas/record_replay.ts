import { z } from 'zod';

export const record_start_input = z.object({
  name: z.string().optional(),
  categories: z.array(z.enum(['input', 'instance_changes', 'property_changes', 'script_execution'])).optional(),
  max_duration_seconds: z.number().positive().max(300).optional().default(60),
});

export const record_stop_input = z.object({});

export const record_get_status_input = z.object({});

export const record_list_input = z.object({
  max_results: z.number().int().min(1).max(100).optional().default(20),
});

export const record_replay_start_input = z.object({
  recording_id: z.string(),
  speed: z.number().positive().optional().default(1),
  start_time: z.number().min(0).optional().default(0),
});

export const record_replay_stop_input = z.object({});

export const record_replay_get_status_input = z.object({});

export const record_export_input = z.object({
  recording_id: z.string(),
  format: z.enum(['json', 'binary']).optional().default('json'),
});

export const record_delete_input = z.object({
  recording_id: z.string(),
});
