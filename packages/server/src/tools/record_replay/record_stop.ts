import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { record_stop_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'record_stop',
  description: 'Stop the current recording session.',
  input_schema: record_stop_input,
  execution_layer: 'plugin',
  category: 'record_replay',
  requires_session: true,
};

export const handler = create_plugin_handler('record_stop');
