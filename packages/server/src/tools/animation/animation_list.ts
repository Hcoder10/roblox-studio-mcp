import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { animation_list_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'animation_list',
  description: 'List all KeyframeSequences and Animations in the DataModel.',
  input_schema: animation_list_input,
  execution_layer: 'plugin',
  category: 'animation',
  requires_session: true,
};

export const handler = create_plugin_handler('animation_list');
