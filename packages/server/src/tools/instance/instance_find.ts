import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { instance_find_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'instance_find',
  description: 'Search for Instances in the DataModel by class name, name pattern, or both. Supports recursive search.',
  input_schema: instance_find_input,
  execution_layer: 'plugin',
  category: 'instance',
  requires_session: true,
};

export const handler = create_plugin_handler('instance_find');
