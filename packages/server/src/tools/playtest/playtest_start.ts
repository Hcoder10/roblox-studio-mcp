import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { playtest_start_input, TIMEOUTS } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'playtest_start',
  description: 'Start a playtest session in Roblox Studio (play, run, or server mode).',
  input_schema: playtest_start_input,
  execution_layer: 'plugin',
  category: 'playtest',
  requires_session: true,
};

export const handler = create_plugin_handler('playtest_start', TIMEOUTS.PLAYTEST_START);
