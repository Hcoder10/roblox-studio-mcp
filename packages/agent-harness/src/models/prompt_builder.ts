import type { AgentDefinition } from '@roblox-studio-mcp/shared';
import { create_knowledge_base } from '../rag/index.js';

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

  if (context.rag_context) {
    sections.push(`\n## Roblox Knowledge\n${context.rag_context as string}`);
  }

  if (context.agent_context) {
    sections.push(`\n## Additional Context\n${context.agent_context as string}`);
  }

  return sections.join('\n');
}

/**
 * Search the RAG knowledge base and return formatted context to inject into prompts.
 * Returns empty string if knowledge base isn't initialized or no results found.
 */
export function augment_with_rag(task_description: string, agent_type: string): string {
  const kb = create_knowledge_base();

  // Build a search query from the task description and agent type
  const query = `${agent_type} ${task_description}`;
  const results = kb.search(query, 8);

  if (results.length === 0) return '';

  const sections = results.map(r => {
    return `### ${r.chunk.title}\n${r.chunk.content}`;
  });

  return `The following Roblox reference material is relevant to this task:\n\n${sections.join('\n\n---\n\n')}`;
}
