import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { ui_instantiate_template_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'ui_instantiate_template',
  description: 'Create a new instance of a saved UI template with optional property overrides.',
  input_schema: ui_instantiate_template_input,
  execution_layer: 'plugin',
  category: 'ui_builder',
  requires_session: true,
};

export const handler = create_plugin_handler('ui_instantiate_template');
