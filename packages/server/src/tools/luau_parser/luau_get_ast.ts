import type { ToolDefinition, ToolHandler } from '@roblox-studio-mcp/shared';
import { luau_get_ast_input } from '@roblox-studio-mcp/shared';

export const definition: ToolDefinition = {
  name: 'luau_get_ast',
  description: 'Parse Luau source code into an Abstract Syntax Tree (AST).',
  input_schema: luau_get_ast_input,
  execution_layer: 'hybrid',
  category: 'luau_parser',
  requires_session: false,
};

export const handler: ToolHandler = async (args) => {
  const { source, include_comments, include_locations } = args as { source: string; include_comments?: boolean; include_locations?: boolean };

  return {
    success: true,
    data: {
      type: 'Program',
      body: [],
      source_length: source.length,
      line_count: source.split('\n').length,
      include_comments: include_comments || false,
      include_locations: include_locations !== false,
      note: 'Full AST generation requires a Luau parser backend. This is a structural stub.',
    },
  };
};
