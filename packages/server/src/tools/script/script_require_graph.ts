import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { script_require_graph_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'script_require_graph',
  description: 'Analyze the require() dependency graph of a script.',
  input_schema: script_require_graph_input,
  execution_layer: 'plugin',
  category: 'script',
  requires_session: true,
};

export const handler = create_plugin_handler('script_require_graph');
