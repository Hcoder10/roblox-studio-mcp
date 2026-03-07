import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { diagnostics_get_render_stats_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'diagnostics_get_render_stats',
  description: 'Get rendering performance statistics.',
  input_schema: diagnostics_get_render_stats_input,
  execution_layer: 'plugin',
  category: 'diagnostics',
  requires_session: true,
};

export const handler = create_plugin_handler('diagnostics_get_render_stats');
