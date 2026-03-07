import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { ui_preview_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'ui_preview',
  description: 'Preview a ScreenGui at an optional resolution.',
  input_schema: ui_preview_input,
  execution_layer: 'plugin',
  category: 'ui_builder',
  requires_session: true,
};

export const handler = create_plugin_handler('ui_preview');
