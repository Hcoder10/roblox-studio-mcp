import type {
  AgentDefinition,
  AgentTask,
  TaskResultPayload,
  WsEvent,
} from '@roblox-studio-mcp/shared';
import { TOOL_CATEGORIES } from '@roblox-studio-mcp/shared';
import type { AgentRunContext, Message, ToolDefinition } from './types.js';
import type { GenerativeModelClient } from './types.js';
import { build_system_prompt } from '../models/prompt_builder.js';
import { ModelFactory } from '../models/model_factory.js';
import { create_tool_call_event } from '../ui/event_stream.js';
import pino from 'pino';

const logger = pino({ name: 'agent-runner' });

const MAX_TURNS = 20;

export class AgentRunner {
  private model_factory: ModelFactory;

  constructor(model_factory: ModelFactory) {
    this.model_factory = model_factory;
  }

  async run(
    task: AgentTask,
    definition: AgentDefinition,
    context: AgentRunContext,
  ): Promise<TaskResultPayload> {
    const client = this.model_factory.create_client(definition.model);

    // Get allowed tools for this agent
    const allowed_tool_names = definition.allowed_tools;
    const all_tool_defs = context.mcp_client.get_tool_definitions();
    const agent_tools = this.filter_tools(all_tool_defs, allowed_tool_names, definition);

    // Build system prompt with context
    const system_prompt = build_system_prompt(definition, {
      available_tools: agent_tools.map(t => t.name),
      current_locks: context.agent.active_locks,
      task_description: `${task.title}\n\n${task.description}`,
      agent_context: `Your agent ID: ${context.agent.id}`,
    });

    const history: Message[] = [
      {
        role: 'user',
        parts: [{ text: `Execute this task:\n\nTitle: ${task.title}\nDescription: ${task.description}` }],
      },
    ];

    let turn = 0;
    let final_text = '';

    // Broadcast that agent is thinking
    context.ws_broadcast({
      type: 'agent_thinking',
      payload: {
        agent_id: context.agent.id,
        agent_type: definition.type,
        task_id: task.id,
        task_title: task.title,
      },
      timestamp: Date.now(),
    });

    while (turn < MAX_TURNS) {
      turn++;
      logger.info(
        { agent_id: context.agent.id, task_id: task.id, turn },
        'Agent turn',
      );

      let agent_turn;
      try {
        agent_turn = await client.generate(system_prompt, agent_tools, history);
      } catch (error) {
        logger.error({ error, agent_id: context.agent.id, turn }, 'LLM call failed');
        return {
          task_id: task.id,
          success: false,
          error: error instanceof Error ? error.message : 'LLM call failed',
        };
      }

      // If there was thinking output, broadcast it
      if (agent_turn.thinking) {
        context.ws_broadcast({
          type: 'agent_thinking',
          payload: {
            agent_id: context.agent.id,
            thinking: agent_turn.thinking.slice(0, 500), // Truncate for WS
          },
          timestamp: Date.now(),
        });
      }

      // Preserve the exact model parts (including thought signatures) whenever available.
      const model_parts: Message['parts'] = agent_turn.model_parts && agent_turn.model_parts.length > 0
        ? agent_turn.model_parts
        : [
            ...(agent_turn.text ? [{ text: agent_turn.text }] as Message['parts'] : []),
            ...agent_turn.tool_calls.map(tc => ({
              functionCall: { name: tc.tool_name, args: tc.args },
            })),
          ];
      history.push({ role: 'model', parts: model_parts });

      // If the model returned text with no tool calls, we're done
      if (agent_turn.done) {
        final_text = agent_turn.text ?? '';
        break;
      }

      // Execute tool calls and collect results
      const tool_response_parts: Message['parts'] = [];

      for (const [index, tc] of agent_turn.tool_calls.entries()) {
        const tool_call_id = `${task.id}:${turn}:${index}:${tc.tool_name}`;

        // Broadcast tool call event
        context.ws_broadcast(
          create_tool_call_event(context.agent.id, tool_call_id, tc.tool_name, tc.args),
        );

        logger.debug(
          { agent_id: context.agent.id, tool: tc.tool_name },
          'Executing tool call',
        );

        const started_at = Date.now();
        const result = await context.mcp_client.call_tool(tc.tool_name, tc.args);
        const duration_ms = Date.now() - started_at;

        // Broadcast tool result
        context.ws_broadcast({
          type: 'agent_tool_result',
          payload: {
            agent_id: context.agent.id,
            tool_call_id,
            tool_name: tc.tool_name,
            status: result.success ? 'success' : 'error',
            success: result.success,
            result: result.success ? (result as any).data : (result as any).error?.message,
            duration_ms,
          },
          timestamp: Date.now(),
        });

        tool_response_parts.push({
          functionResponse: {
            name: tc.tool_name,
            response: result.success
              ? { result: (result as any).data }
              : { error: (result as any).error?.message ?? 'Tool call failed' },
          },
        });
      }

      history.push({ role: 'tool', parts: tool_response_parts });
    }

    if (turn >= MAX_TURNS) {
      logger.warn({ agent_id: context.agent.id, task_id: task.id }, 'Max turns reached');
      return {
        task_id: task.id,
        success: false,
        error: 'Max turns reached without completing task',
      };
    }

    return {
      task_id: task.id,
      success: true,
      result: final_text,
    };
  }

  private filter_tools(
    all_tools: ToolDefinition[],
    allowed_names: string[],
    definition: AgentDefinition,
  ): ToolDefinition[] {
    // Collect all allowed tool names from explicit list and categories
    const allowed = new Set(allowed_names);

    for (const category of definition.allowed_categories) {
      const cat_tools = TOOL_CATEGORIES[category] as string[] | undefined;
      if (cat_tools) {
        for (const t of cat_tools) allowed.add(t);
      }
    }

    return all_tools.filter(t => allowed.has(t.name));
  }
}
