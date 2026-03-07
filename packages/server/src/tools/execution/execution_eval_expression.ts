import type { ToolDefinition } from '@roblox-studio-mcp/shared';
import { execution_eval_expression_input } from '@roblox-studio-mcp/shared';
import { create_plugin_handler } from '../plugin_handler.js';

export const definition: ToolDefinition = {
  name: 'execution_eval_expression',
  description: 'Evaluate a Luau expression and return its value.',
  input_schema: execution_eval_expression_input,
  execution_layer: 'plugin',
  category: 'execution',
  requires_session: true,
};

export const handler = create_plugin_handler('execution_eval_expression');
