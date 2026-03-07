import type { ToolDefinition, ToolHandler } from '@roblox-studio-mcp/shared';
import { luau_format_input } from '@roblox-studio-mcp/shared';

export const definition: ToolDefinition = {
  name: 'luau_format',
  description: 'Format Luau source code with configurable style options.',
  input_schema: luau_format_input,
  execution_layer: 'hybrid',
  category: 'luau_parser',
  requires_session: false,
};

export const handler: ToolHandler = async (args) => {
  const { source, indent_width, use_tabs } = args as { source: string; indent_width?: number; use_tabs?: boolean };
  // Basic formatting: normalize line endings and trailing whitespace
  const indent_char = use_tabs !== false ? '\t' : ' '.repeat(indent_width || 4);
  const formatted = source
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n');

  return {
    success: true,
    data: {
      formatted,
      indent_style: use_tabs !== false ? 'tabs' : 'spaces',
      indent_width: indent_width || 4,
      note: 'Basic formatting applied. Full Luau formatter requires a parser backend.',
    },
  };
};
