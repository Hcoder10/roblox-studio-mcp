import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { instance_get_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'instance_get',
  description: 'Get detailed information about an Instance including its class, name, properties, and optionally children up to a specified depth.',
  input_schema: instance_get_input,
  execution_layer: 'plugin',
  category: 'instance',
  requires_session: true,
};

export const handler = create_plugin_handler('instance_get');
