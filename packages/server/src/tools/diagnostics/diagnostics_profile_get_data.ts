import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { diagnostics_profile_get_data_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'diagnostics_profile_get_data',
  description: 'Get the results of the most recent profiling session.',
  input_schema: diagnostics_profile_get_data_input,
  execution_layer: 'plugin',
  category: 'diagnostics',
  requires_session: true,
};

export const handler = create_plugin_handler('diagnostics_profile_get_data');
