import type { AgentTask } from '@roblox-studio-mcp/shared';
import type { GenerativeModelClient } from '../agents/types.js';
import { v4 as uuid } from 'uuid';
import pino from 'pino';

const logger = pino({ name: 'task-decomposer' });

const DECOMPOSITION_PROMPT = `You are a task decomposition engine for a multi-agent Roblox Studio building system.

Given a user request and optionally the current studio state, break the request into concrete tasks.

Each task must be assigned to exactly one agent type:
- "building_lead" — for creating/modifying instances, terrain, world building
- "scripting_lead" — for creating/modifying scripts, game logic
- "visual_lead" — for lighting, particles, materials, visual effects, atmosphere

Output ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "tasks": [
    {
      "title": "Short descriptive title",
      "description": "Detailed description of what to build/code, including specific parameters, positions, sizes, colors, etc.",
      "agent_type": "building_lead",
      "priority": 1,
      "depends_on_indices": []
    }
  ]
}

Rules:
- Be specific in descriptions: include exact values for positions, sizes, colors, materials.
- Set dependencies correctly: scripting tasks that reference built objects depend on those building tasks.
- Priority 1 = highest, 5 = lowest. Independent tasks can share priority.
- Keep tasks at a reasonable granularity — each task should be 1-10 tool calls.
- depends_on_indices is an array of 0-based indices of other tasks in the array.`;

export async function decompose_request(
  request: string,
  studio_state: unknown,
  model: GenerativeModelClient,
): Promise<AgentTask[]> {
  let user_content = `User request: ${request}`;
  if (studio_state) {
    user_content += `\n\nCurrent studio state:\n${JSON.stringify(studio_state, null, 2)}`;
  }

  const turn = await model.generate(
    DECOMPOSITION_PROMPT,
    [],
    [{ role: 'user', parts: [{ text: user_content }] }],
  );

  const response_text = turn.text ?? '';

  let parsed: { tasks: Array<{
    title: string;
    description: string;
    agent_type: string;
    priority: number;
    depends_on_indices: number[];
  }> };

  try {
    // Try to extract JSON from the response (handle markdown code blocks)
    const json_match = response_text.match(/\{[\s\S]*\}/);
    if (!json_match) {
      throw new Error('No JSON found in response');
    }
    parsed = JSON.parse(json_match[0]);
  } catch (error) {
    logger.error({ error, response: response_text.slice(0, 500) }, 'Failed to parse decomposition response');
    // Return a single task with the full request as fallback
    return [{
      id: uuid(),
      title: 'Execute user request',
      description: request,
      status: 'pending',
      assigned_to: null,
      created_by: 'orchestrator',
      priority: 1,
      dependencies: [],
      created_at: Date.now(),
    }];
  }

  // Create task objects with generated IDs
  const tasks: AgentTask[] = [];
  const id_map = new Map<number, string>();

  // First pass: create all tasks with IDs
  for (let i = 0; i < parsed.tasks.length; i++) {
    const t = parsed.tasks[i];
    const id = uuid();
    id_map.set(i, id);

    tasks.push({
      id,
      title: t.title,
      description: t.description + `\n\n[Agent Type: ${t.agent_type}]`,
      status: 'pending',
      assigned_to: null,
      created_by: 'orchestrator',
      priority: t.priority ?? 3,
      dependencies: [], // Filled in second pass
      created_at: Date.now(),
    });
  }

  // Second pass: resolve dependency indices to IDs
  for (let i = 0; i < parsed.tasks.length; i++) {
    const deps = parsed.tasks[i].depends_on_indices ?? [];
    tasks[i].dependencies = deps
      .map(idx => id_map.get(idx))
      .filter((id): id is string => id !== undefined);
  }

  logger.info({ task_count: tasks.length }, 'Request decomposed into tasks');
  return tasks;
}
