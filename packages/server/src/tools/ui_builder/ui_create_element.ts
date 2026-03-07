import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { ui_create_element_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'ui_create_element',
  description: 'Create a UI element (Frame, TextLabel, TextButton, etc.) in a GUI container.',
  input_schema: ui_create_element_input,
  execution_layer: 'plugin',
  category: 'ui_builder',
  requires_session: true,
};

export const handler = create_plugin_handler('ui_create_element');
