import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { ui_set_layout_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'ui_set_layout',
  description: 'Add a layout controller (UIListLayout, UIGridLayout, etc.) to a container.',
  input_schema: ui_set_layout_input,
  execution_layer: 'plugin',
  category: 'ui_builder',
  requires_session: true,
};

export const handler = create_plugin_handler('ui_set_layout');
