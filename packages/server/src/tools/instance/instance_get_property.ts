import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { instance_get_property_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'instance_get_property',
  description: 'Get a specific property value from an Instance.',
  input_schema: instance_get_property_input,
  execution_layer: 'plugin',
  category: 'instance',
  requires_session: true,
};

export const handler = create_plugin_handler('instance_get_property');
