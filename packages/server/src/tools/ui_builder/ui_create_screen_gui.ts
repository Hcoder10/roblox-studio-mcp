import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { ui_create_screen_gui_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'ui_create_screen_gui',
  description: 'Create a new ScreenGui container for UI elements.',
  input_schema: ui_create_screen_gui_input,
  execution_layer: 'plugin',
  category: 'ui_builder',
  requires_session: true,
};

export const handler = create_plugin_handler('ui_create_screen_gui');
