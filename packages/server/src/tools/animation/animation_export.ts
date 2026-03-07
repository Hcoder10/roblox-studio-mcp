import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { animation_export_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'animation_export',
  description: 'Export a KeyframeSequence to JSON or RBXMX format.',
  input_schema: animation_export_input,
  execution_layer: 'plugin',
  category: 'animation',
  requires_session: true,
};

export const handler = create_plugin_handler('animation_export');
