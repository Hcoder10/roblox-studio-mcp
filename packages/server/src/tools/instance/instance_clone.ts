import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { instance_clone_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'instance_clone',
  description: 'Clone an Instance and place it under a new parent. Optionally rename the clone.',
  input_schema: instance_clone_input,
  execution_layer: 'plugin',
  category: 'instance',
  requires_session: true,
};

export const handler = create_plugin_handler('instance_clone');
