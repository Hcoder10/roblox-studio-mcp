import type { ToolDefinition, ToolHandler } from '@roblox-studio-mcp/shared';
import { luau_lint_input } from '@roblox-studio-mcp/shared';

export const definition: ToolDefinition = {
  name: 'luau_lint',
  description: 'Lint Luau source code for common issues and style violations.',
  input_schema: luau_lint_input,
  execution_layer: 'hybrid',
  category: 'luau_parser',
  requires_session: false,
};

export const handler: ToolHandler = async (args) => {
  const { source } = args as { source: string };
  const warnings: Array<{ line: number; rule: string; message: string }> = [];
  const lines = source.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/\bprint\s*\(/)) {
      warnings.push({ line: i + 1, rule: 'no-print', message: 'Avoid print() in production code' });
    }
    if (line.match(/\bgame\.[A-Z]\w+\b/) && !line.match(/game:GetService/)) {
      warnings.push({ line: i + 1, rule: 'use-getservice', message: 'Use game:GetService() instead of direct property access' });
    }
    if (line.match(/\bwait\s*\(/)) {
      warnings.push({ line: i + 1, rule: 'no-wait', message: 'Use task.wait() instead of wait()' });
    }
  }

  return { success: true, data: { warnings, warning_count: warnings.length } };
};
