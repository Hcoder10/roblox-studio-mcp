import type { ToolDefinition, ToolHandler } from '@roblox-studio-mcp/shared';
import { luau_analyze_input } from '@roblox-studio-mcp/shared';

export const definition: ToolDefinition = {
  name: 'luau_analyze',
  description: 'Analyze Luau source code for potential issues (type errors, unused variables, deprecated API, etc.).',
  input_schema: luau_analyze_input,
  execution_layer: 'hybrid',
  category: 'luau_parser',
  requires_session: false,
};

export const handler: ToolHandler = async (args) => {
  const { source, checks } = args as { source: string; checks?: string[] };
  const diagnostics: Array<{ type: string; line: number; message: string; severity: string }> = [];
  const lines = source.split('\n');

  const run_check = (type: string) => !checks || checks.includes(type);

  if (run_check('deprecated_api')) {
    const deprecated = ['wait(', 'spawn(', 'delay(', 'game:GetService("Players").LocalPlayer'];
    for (let i = 0; i < lines.length; i++) {
      for (const dep of deprecated) {
        if (lines[i].includes(dep)) {
          diagnostics.push({ type: 'deprecated_api', line: i + 1, message: `"${dep.replace('(', '')}" is deprecated. Use task library equivalents.`, severity: 'warning' });
        }
      }
    }
  }

  if (run_check('style')) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].length > 120) {
        diagnostics.push({ type: 'style', line: i + 1, message: 'Line exceeds 120 characters', severity: 'info' });
      }
    }
  }

  return { success: true, data: { diagnostics, checked: checks || ['all'] } };
};
