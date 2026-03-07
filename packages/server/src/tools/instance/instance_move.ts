import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { instance_move_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'instance_move',
  description: 'Move an Instance to a new parent in the DataModel.',
  input_schema: instance_move_input,
  execution_layer: 'plugin',
  category: 'instance',
  requires_session: true,
};

export const handler = create_plugin_handler('instance_move');
