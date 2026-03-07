import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { instance_set_property_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'instance_set_property',
  description: 'Set a property value on an Instance. Supports primitive types, Vector3, CFrame, Color3, UDim2, and Enums.',
  input_schema: instance_set_property_input,
  execution_layer: 'plugin',
  category: 'instance',
  requires_session: true,
};

export const handler = create_plugin_handler('instance_set_property');
