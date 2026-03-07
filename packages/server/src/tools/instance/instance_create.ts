import type { ToolDefinition, ToolModule } from '@roblox-studio-mcp/shared';
import { instance_create_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'instance_create',
  description: 'Create a new Roblox Instance in the DataModel. Specify class name, instance name, parent path, and optional initial properties.',
  input_schema: instance_create_input,
  execution_layer: 'plugin',
  category: 'instance',
  requires_session: true,
};

export const handler = create_plugin_handler('instance_create');
