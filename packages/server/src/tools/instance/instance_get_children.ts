import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { instance_get_children_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'instance_get_children',
  description: 'Get the children of an Instance, optionally filtered by class name.',
  input_schema: instance_get_children_input,
  execution_layer: 'plugin',
  category: 'instance',
  requires_session: true,
};

export const handler = create_plugin_handler('instance_get_children');
