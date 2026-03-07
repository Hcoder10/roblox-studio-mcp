import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { execution_require_module_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'execution_require_module',
  description: 'Require a ModuleScript and return its exports.',
  input_schema: execution_require_module_input,
  execution_layer: 'plugin',
  category: 'execution',
  requires_session: true,
};

export const handler = create_plugin_handler('execution_require_module');
