import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { execution_run_luau_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'execution_run_luau',
  description: 'Execute arbitrary Luau code in the Roblox Studio plugin context. Returns the result or error.',
  input_schema: execution_run_luau_input,
  execution_layer: 'plugin',
  category: 'execution',
  requires_session: true,
};

export const handler = create_plugin_handler('execution_run_luau');
