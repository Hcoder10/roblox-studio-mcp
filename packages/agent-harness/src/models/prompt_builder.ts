import type { AgentDefinition } from '@roblox-studio-mcp/shared';

export function build_system_prompt(
  definition: AgentDefinition,
  context: Record<string, unknown>,
): string {
  const sections: string[] = [definition.system_prompt];

  if (context.available_tools) {
    const tools = context.available_tools as string[];
    sections.push(`\n## Available Tools\nYou have access to these tools: ${tools.join(', ')}`);
  }

  if (context.current_locks) {
    const locks = context.current_locks as string[];
    if (locks.length > 0) {
      sections.push(`\n## Currently Held Locks\n${locks.join('\n')}`);
    }
  }

  if (context.task_description) {
    sections.push(`\n## Current Task\n${context.task_description as string}`);
  }

  if (context.task_constraints) {
    const constraints = context.task_constraints as string[];
    if (constraints.length > 0) {
      sections.push(`\n## Constraints\n${constraints.map(c => `- ${c}`).join('\n')}`);
    }
  }

  if (context.studio_state) {
    sections.push(
      `\n## Current Studio State\n\`\`\`json\n${JSON.stringify(context.studio_state, null, 2)}\n\`\`\``,
    );
  }

  if (context.agent_context) {
    sections.push(`\n## Additional Context\n${context.agent_context as string}`);
  }

  return sections.join('\n');
}
