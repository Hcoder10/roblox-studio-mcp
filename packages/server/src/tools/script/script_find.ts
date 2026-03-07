import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { script_find_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'script_find',
  description: 'Search for scripts by source code pattern or class type.',
  input_schema: script_find_input,
  execution_layer: 'plugin',
  category: 'script',
  requires_session: true,
};

export const handler = create_plugin_handler('script_find');
