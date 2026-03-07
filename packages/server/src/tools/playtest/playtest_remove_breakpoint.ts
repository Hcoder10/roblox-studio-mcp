import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { playtest_remove_breakpoint_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'playtest_remove_breakpoint',
  description: 'Remove a breakpoint from a script at a specific line.',
  input_schema: playtest_remove_breakpoint_input,
  execution_layer: 'plugin',
  category: 'playtest',
  requires_session: true,
};

export const handler = create_plugin_handler('playtest_remove_breakpoint');
