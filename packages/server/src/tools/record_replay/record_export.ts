import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { record_export_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'record_export',
  description: 'Export a recording to JSON or binary format.',
  input_schema: record_export_input,
  execution_layer: 'plugin',
  category: 'record_replay',
  requires_session: true,
};

export const handler = create_plugin_handler('record_export');
