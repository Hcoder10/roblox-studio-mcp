import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { script_create_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'script_create',
  description: 'Create a new Script, LocalScript, or ModuleScript in the DataModel with optional source code.',
  input_schema: script_create_input,
  execution_layer: 'plugin',
  category: 'script',
  requires_session: true,
};

export const handler = create_plugin_handler('script_create');
