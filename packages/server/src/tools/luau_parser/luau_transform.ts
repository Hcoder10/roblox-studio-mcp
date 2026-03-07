import type { ToolDefinition, ToolHandler } from '@roblox-studio-mcp/shared';
import { luau_transform_input } from '@roblox-studio-mcp/shared';

export const definition: ToolDefinition = {
  name: 'luau_transform',
  description: 'Apply transformations to Luau source code (minify, rename locals, dead code elimination, etc.).',
  input_schema: luau_transform_input,
  execution_layer: 'hybrid',
  category: 'luau_parser',
  requires_session: false,
};

export const handler: ToolHandler = async (args) => {
  const { source, transforms } = args as { source: string; transforms: string[] };

  return {
    success: true,
    data: {
      transformed: source,
      transforms_applied: transforms,
      note: 'Full source transformation requires a Luau parser backend. Source returned unchanged.',
    },
  };
};
