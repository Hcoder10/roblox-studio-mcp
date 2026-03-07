import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { record_list_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'record_list',
  description: 'List all available recordings.',
  input_schema: record_list_input,
  execution_layer: 'plugin',
  category: 'record_replay',
  requires_session: true,
};

export const handler = create_plugin_handler('record_list');
