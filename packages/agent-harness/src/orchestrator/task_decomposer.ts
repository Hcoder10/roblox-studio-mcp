import type { AgentTask } from '@roblox-studio-mcp/shared';
import type { GenerativeModelClient } from '../agents/types.js';
import { v4 as uuid } from 'uuid';
import pino from 'pino';

const logger = pino({ name: 'task-decomposer' });

/**
 * Extract the first balanced JSON object from a string.
 * Handles strings and escaped characters correctly.
 */
function extract_json_object(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let in_string = false;
  let escape_next = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (escape_next) {
      escape_next = false;
      continue;
    }

    if (ch === '\\' && in_string) {
      escape_next = true;
      continue;
    }

    if (ch === '"') {
      in_string = !in_string;
      continue;
    }

    if (in_string) continue;

    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

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
      "depends_on_indices": [],
      "lock_paths": ["Workspace.Map"]
    }
  ]
}

Rules:
- Be specific in descriptions: include exact values for positions, sizes, colors, materials.
- Set dependencies correctly: scripting tasks that reference built objects depend on those building tasks.
- Priority 1 = highest, 5 = lowest. Independent tasks can share priority.
- Keep tasks at a reasonable granularity — each task should be 1-10 tool calls.
- depends_on_indices is an array of 0-based indices of other tasks in the array.
- lock_paths: the specific Roblox DataModel paths this task needs EXCLUSIVE write access to (e.g., "Workspace.Map", "ServerScriptService.GameManager", "Lighting").

Lock path rules:
- Building tasks should lock specific sub-paths under Workspace (e.g., "Workspace.Map", "Workspace.Obby"), NOT all of "Workspace".
- Scripting tasks should lock their specific script paths (e.g., "ServerScriptService.GameManager", "ReplicatedStorage.Modules").
- Visual tasks should lock "Lighting" and specific effect paths, NOT all of "Workspace".
- lock_paths must NOT overlap between tasks that can run in parallel (no dependencies between them).
- Tasks that need the same paths MUST have dependencies between them (use depends_on_indices).
- NEVER create a task that deletes or clears Workspace children — always create under specific sub-folders.`;

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
    lock_paths?: string[];
  }> };

  try {
    // BUG FIX: Use balanced brace matching instead of greedy regex to avoid
    // capturing garbage after the JSON object
    const json_str = extract_json_object(response_text);
    if (!json_str) {
      throw new Error('No JSON found in response');
    }
    parsed = JSON.parse(json_str);
  } catch (error) {
    logger.error({ error, response: response_text.slice(0, 500) }, 'Failed to parse decomposition response');
    // BUG FIX: Fallback task must include [Agent Type:] annotation or
    // extract_agent_type() in orchestrator will return null and fail the task.
    // Default to building_lead as a reasonable fallback.
    return [{
      id: uuid(),
      title: 'Execute user request',
      description: request + '\n\n[Agent Type: building_lead]',
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
      lock_paths: t.lock_paths ?? [],
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
