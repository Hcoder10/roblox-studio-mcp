import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { instance_delete_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'instance_delete',
  description: 'Delete an Instance from the DataModel by its path.',
  input_schema: instance_delete_input,
  execution_layer: 'plugin',
  category: 'instance',
  requires_session: true,
};

export const handler = create_plugin_handler('instance_delete');
