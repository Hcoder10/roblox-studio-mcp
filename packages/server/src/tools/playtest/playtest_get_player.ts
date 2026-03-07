import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { playtest_get_player_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'playtest_get_player',
  description: 'Get information about a player in the current playtest session.',
  input_schema: playtest_get_player_input,
  execution_layer: 'plugin',
  category: 'playtest',
  requires_session: true,
};

export const handler = create_plugin_handler('playtest_get_player');
