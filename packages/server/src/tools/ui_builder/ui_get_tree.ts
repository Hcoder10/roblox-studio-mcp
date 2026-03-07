import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { ui_get_tree_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'ui_get_tree',
  description: 'Get the UI hierarchy tree from a root element.',
  input_schema: ui_get_tree_input,
  execution_layer: 'plugin',
  category: 'ui_builder',
  requires_session: true,
};

export const handler = create_plugin_handler('ui_get_tree');
