import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { script_validate_syntax_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'script_validate_syntax',
  description: 'Validate the syntax of Luau source code without executing it.',
  input_schema: script_validate_syntax_input,
  execution_layer: 'plugin',
  category: 'script',
  requires_session: true,
};

export const handler = create_plugin_handler('script_validate_syntax');
