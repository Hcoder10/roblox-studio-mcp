import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { playtest_step_debugger_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'playtest_step_debugger',
  description: 'Control the debugger: continue, step over, step into, or step out.',
  input_schema: playtest_step_debugger_input,
  execution_layer: 'plugin',
  category: 'playtest',
  requires_session: true,
};

export const handler = create_plugin_handler('playtest_step_debugger');
