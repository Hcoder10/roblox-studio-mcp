import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { playtest_set_breakpoint_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'playtest_set_breakpoint',
  description: 'Set a breakpoint in a script at a specific line, with optional condition.',
  input_schema: playtest_set_breakpoint_input,
  execution_layer: 'plugin',
  category: 'playtest',
  requires_session: true,
};

export const handler = create_plugin_handler('playtest_set_breakpoint');
