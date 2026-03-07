import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { record_replay_stop_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'record_replay_stop',
  description: 'Stop the current replay.',
  input_schema: record_replay_stop_input,
  execution_layer: 'plugin',
  category: 'record_replay',
  requires_session: true,
};

export const handler = create_plugin_handler('record_replay_stop');
