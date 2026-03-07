import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { playtest_simulate_input_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'playtest_simulate_input',
  description: 'Simulate user input during a playtest (keyboard or mouse events).',
  input_schema: playtest_simulate_input_input,
  execution_layer: 'plugin',
  category: 'playtest',
  requires_session: true,
};

export const handler = create_plugin_handler('playtest_simulate_input');
