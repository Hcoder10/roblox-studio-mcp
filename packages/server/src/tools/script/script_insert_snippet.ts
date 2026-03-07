import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { script_insert_snippet_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'script_insert_snippet',
  description: 'Insert a code snippet at a specific line in a script.',
  input_schema: script_insert_snippet_input,
  execution_layer: 'plugin',
  category: 'script',
  requires_session: true,
};

export const handler = create_plugin_handler('script_insert_snippet');
