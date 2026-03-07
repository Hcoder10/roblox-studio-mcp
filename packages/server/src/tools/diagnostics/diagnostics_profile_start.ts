import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { diagnostics_profile_start_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'diagnostics_profile_start',
  description: 'Start a performance profiling session.',
  input_schema: diagnostics_profile_start_input,
  execution_layer: 'plugin',
  category: 'diagnostics',
  requires_session: true,
};

export const handler = create_plugin_handler('diagnostics_profile_start');
