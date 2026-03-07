import type { ToolDefinition, ToolHandler } from '@roblox-studio-mcp/shared';
import { luau_parse_input } from '@roblox-studio-mcp/shared';

export const definition: ToolDefinition = {
  name: 'luau_parse',
  description: 'Parse Luau source code and return a structured representation. Validates syntax and reports errors.',
  input_schema: luau_parse_input,
  execution_layer: 'hybrid',
  category: 'luau_parser',
  requires_session: false,
};

export const handler: ToolHandler = async (args) => {
  const { source } = args as { source: string };
  const lines = source.split('\n');
  const errors: Array<{ line: number; column: number; message: string }> = [];

  // Basic syntax validation
  let open_parens = 0;
  let open_brackets = 0;
  let open_braces = 0;
  let in_string = false;
  let string_char = '';
  let in_comment = false;
  let in_block_comment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    in_comment = false;
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      const next = line[j + 1];

      if (in_block_comment) {
        if (ch === ']' && next === ']') { in_block_comment = false; j++; }
        continue;
      }
      if (in_comment) continue;
      if (in_string) {
        if (ch === '\\') { j++; continue; }
        if (ch === string_char) in_string = false;
        continue;
      }
      if (ch === '-' && next === '-') {
        if (line[j + 2] === '[' && line[j + 3] === '[') { in_block_comment = true; j += 3; }
        else in_comment = true;
        continue;
      }
      if (ch === '"' || ch === "'") { in_string = true; string_char = ch; continue; }
      if (ch === '(') open_parens++;
      if (ch === ')') open_parens--;
      if (ch === '[') open_brackets++;
      if (ch === ']') open_brackets--;
      if (ch === '{') open_braces++;
      if (ch === '}') open_braces--;
    }
  }

  if (open_parens !== 0) errors.push({ line: lines.length, column: 1, message: `Unmatched parentheses (balance: ${open_parens})` });
  if (open_brackets !== 0) errors.push({ line: lines.length, column: 1, message: `Unmatched brackets (balance: ${open_brackets})` });
  if (open_braces !== 0) errors.push({ line: lines.length, column: 1, message: `Unmatched braces (balance: ${open_braces})` });
  if (in_string) errors.push({ line: lines.length, column: 1, message: 'Unterminated string literal' });

  return {
    success: true,
    data: {
      valid: errors.length === 0,
      errors,
      line_count: lines.length,
      char_count: source.length,
    },
  };
};
