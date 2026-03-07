import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { ui_apply_style_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'ui_apply_style',
  description: 'Apply visual styles (colors, size, position, text, font, padding, etc.) to a UI element.',
  input_schema: ui_apply_style_input,
  execution_layer: 'plugin',
  category: 'ui_builder',
  requires_session: true,
};

export const handler = create_plugin_handler('ui_apply_style');
