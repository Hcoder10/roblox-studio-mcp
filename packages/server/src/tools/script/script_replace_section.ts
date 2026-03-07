import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { script_replace_section_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'script_replace_section',
  description: 'Replace a range of lines in a script with new code.',
  input_schema: script_replace_section_input,
  execution_layer: 'plugin',
  category: 'script',
  requires_session: true,
};

export const handler = create_plugin_handler('script_replace_section');
