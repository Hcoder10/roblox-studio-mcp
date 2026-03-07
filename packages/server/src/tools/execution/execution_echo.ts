import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { execution_echo_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'execution_echo',
  description: 'Echo a message through the plugin to verify end-to-end connectivity. The plugin receives the message and echoes it back.',
  input_schema: execution_echo_input,
  execution_layer: 'plugin',
  category: 'execution',
  requires_session: true,
};

export const handler = create_plugin_handler('execution_echo');
