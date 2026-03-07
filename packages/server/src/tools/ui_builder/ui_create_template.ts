import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { ui_create_template_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'ui_create_template',
  description: 'Save a UI element as a reusable template.',
  input_schema: ui_create_template_input,
  execution_layer: 'plugin',
  category: 'ui_builder',
  requires_session: true,
};

export const handler = create_plugin_handler('ui_create_template');
