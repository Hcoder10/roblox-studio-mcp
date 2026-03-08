import type {
  AgentTask,
  AgentType,
  WsEvent,
  TaskAssignPayload,
  TaskResultPayload,
} from '@roblox-studio-mcp/shared';
import { AgentRegistry } from '../agents/agent_registry.js';
import { AgentRunner } from '../agents/agent_runner.js';
import { LockManager } from '../locks/lock_manager.js';
import { MessageBus } from '../messages/message_bus.js';
import { TaskQueue } from './task_queue.js';
import { McpClient } from '../tools/mcp_client.js';
import { ToolProxy } from '../tools/tool_proxy.js';
import { ModelFactory } from '../models/model_factory.js';
import { decompose_request } from './task_decomposer.js';
import { create_task_event, create_agent_status_event, create_error_event } from '../ui/event_stream.js';
import { v4 as uuid } from 'uuid';
import pino from 'pino';

const logger = pino({ name: 'orchestrator' });

// Map from agent_type annotation in task description to AgentType
const AGENT_TYPE_MAP: Record<string, AgentType> = {
  orchestrator: 'orchestrator',
  planning: 'planning',
  building_lead: 'building_lead',
  scripting_lead: 'scripting_lead',
  visual_lead: 'visual_lead',
  video_analysis: 'video_analysis',
  worker_building: 'worker_building',
  worker_scripting: 'worker_scripting',
  worker_vfx: 'worker_vfx',
  worker_texture: 'worker_texture',
  testing: 'testing',
  texture_generator: 'texture_generator',
};

export class Orchestrator {
  private agent_runner: AgentRunner;
  private tool_proxy: ToolProxy;

  constructor(
    private agent_registry: AgentRegistry,
    private lock_manager: LockManager,
    private message_bus: MessageBus,
    private task_queue: TaskQueue,
    private mcp_client: McpClient,
    private model_factory: ModelFactory,
  ) {
    this.agent_runner = new AgentRunner(model_factory);
    this.tool_proxy = new ToolProxy(mcp_client, lock_manager);
  }

  async handle_user_message(
    message: string,
    ws_broadcast: (event: WsEvent) => void,
  ): Promise<string> {
    logger.info({ message: message.slice(0, 200) }, 'Processing user message');

    ws_broadcast({
      type: 'user_message',
      payload: { text: message, content: message },
      timestamp: Date.now(),
    });

    try {
      // 0. Ensure MCP client is initialized with tools
      await this.mcp_client.ensure_initialized();

      // 1. Create orchestrator model client
      const orchestrator_def = this.agent_registry.get_definitions().find(d => d.type === 'orchestrator');
      if (!orchestrator_def) {
        throw new Error('Orchestrator agent definition not registered');
      }
      const model = this.model_factory.create_client(orchestrator_def.model);

      // 2. Decompose request into tasks
      ws_broadcast({
        type: 'agent_thinking',
        payload: { agent_id: 'orchestrator', thinking: 'Analyzing request and planning tasks...' },
        timestamp: Date.now(),
      });

      const tasks = await this.run_planning(message, model);

      // 3. Add tasks to queue and broadcast
      for (const task of tasks) {
        this.task_queue.add(task);
        ws_broadcast(create_task_event(task, 'created'));
      }

      // 4. Assign tasks to appropriate agents
      const results = await this.execute_tasks(tasks, ws_broadcast);

      // 5. Synthesize response
      const response = this.synthesize_response(message, tasks, results);

      ws_broadcast({
        type: 'agent_message',
        payload: { agent_id: 'orchestrator', content: response, text: response },
        timestamp: Date.now(),
      });

      return response;
    } catch (error) {
      const error_msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ error }, 'Failed to process user message');
      ws_broadcast(create_error_event(error_msg));
      return `I encountered an error: ${error_msg}`;
    }
  }

  private async run_planning(
    request: string,
    model: import('../agents/types.js').GenerativeModelClient,
  ): Promise<AgentTask[]> {
    // Optionally get current studio state for context
    let studio_state: unknown = null;
    try {
      const status_result = await this.mcp_client.call_tool('session_status', {});
      if (status_result.success) {
        studio_state = (status_result as any).data;
      }
    } catch {
      logger.debug('Could not fetch studio state for planning');
    }

    return decompose_request(request, studio_state, model);
  }

  private async execute_tasks(
    tasks: AgentTask[],
    ws_broadcast: (event: WsEvent) => void,
  ): Promise<Map<string, TaskResultPayload>> {
    const results = new Map<string, TaskResultPayload>();

    // Process tasks in dependency order
    // Tasks with no dependencies (or all deps completed) run in parallel
    // BUG FIX: Added max_iterations guard to prevent infinite busy-wait
    // if tasks get stuck. Also check for blocked-forever tasks (pending with
    // all deps failed).
    const MAX_WAIT_ITERATIONS = 600; // 600 * 500ms = 5 minutes max wait
    let wait_iterations = 0;

    while (true) {
      const ready = this.task_queue.get_ready();
      if (ready.length === 0) {
        // Check if there are still in-progress tasks
        const in_progress = tasks.filter(t => t.status === 'in_progress');
        if (in_progress.length === 0) {
          // Check for tasks that are forever-blocked (pending with all deps failed)
          const stuck_pending = tasks.filter(t => t.status === 'pending');
          for (const task of stuck_pending) {
            const has_failed_dep = task.dependencies.some(dep_id => {
              const dep = this.task_queue.get(dep_id);
              return dep && (dep.status === 'failed' || dep.status === 'cancelled');
            });
            if (has_failed_dep) {
              this.task_queue.update(task.id, {
                status: 'cancelled',
                error: 'Cancelled: dependency task failed',
                completed_at: Date.now(),
              });
              const cancelled_task = this.task_queue.get(task.id);
              if (cancelled_task) ws_broadcast(create_task_event(cancelled_task, 'updated'));
            }
          }
          break;
        }
        // Wait for in-progress tasks with timeout guard
        wait_iterations++;
        if (wait_iterations >= MAX_WAIT_ITERATIONS) {
          logger.error({ tasks: tasks.map(t => ({ id: t.id, status: t.status })) },
            'Timeout waiting for tasks to complete');
          // Fail remaining in-progress tasks
          for (const task of in_progress) {
            this.task_queue.update(task.id, {
              status: 'failed',
              error: 'Timed out waiting for completion',
              completed_at: Date.now(),
            });
          }
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }

      wait_iterations = 0; // Reset counter when we have ready tasks

      // Execute ready tasks sequentially (one at a time) to prevent overwriting
      for (const task of ready) {
        await this.execute_single_task(task, ws_broadcast, results);
      }

      // Check if all tasks are done
      const all_done = tasks.every(t =>
        t.status === 'completed' || t.status === 'failed' || t.status === 'cancelled',
      );
      if (all_done) break;
    }

    return results;
  }

  private async execute_single_task(
    task: AgentTask,
    ws_broadcast: (event: WsEvent) => void,
    results: Map<string, TaskResultPayload>,
  ): Promise<void> {
    // Extract agent type from task description
    const agent_type = this.extract_agent_type(task);
    if (!agent_type) {
      this.task_queue.update(task.id, { status: 'failed', error: 'No agent type specified' });
      // BUG FIX: Guard against undefined from task_queue.get() instead of non-null assertion
      const updated_task = this.task_queue.get(task.id);
      if (updated_task) ws_broadcast(create_task_event(updated_task, 'updated'));
      return;
    }

    // Find or spawn an agent for this task
    const definition = this.agent_registry.get_definitions().find(d => d.type === agent_type);
    if (!definition) {
      this.task_queue.update(task.id, {
        status: 'failed',
        error: `No definition for agent type: ${agent_type}`,
      });
      const updated_task = this.task_queue.get(task.id);
      if (updated_task) ws_broadcast(create_task_event(updated_task, 'updated'));
      return;
    }

    let agent = this.agent_registry.find_idle_by_type(agent_type);
    if (!agent) {
      agent = this.agent_registry.spawn(definition.id);
    }

    // Register agent with tool proxy
    this.tool_proxy.register_agent(agent.id, definition);

    // Update task and agent status
    this.task_queue.update(task.id, {
      status: 'in_progress',
      assigned_to: agent.id,
      started_at: Date.now(),
    });
    this.agent_registry.update_status(agent.id, 'thinking');
    agent.current_task_id = task.id;

    const in_progress_task = this.task_queue.get(task.id);
    if (in_progress_task) ws_broadcast(create_task_event(in_progress_task, 'updated'));
    ws_broadcast(create_agent_status_event(agent));

    // Acquire locks for this task
    const lock_paths: string[] = (task as any).lock_paths?.length > 0
      ? (task as any).lock_paths
      : definition.lock_scope.allowed_paths;
    const lock_categories = definition.lock_scope.allowed_categories;

    if (lock_paths.length > 0 || lock_categories.length > 0) {
      const lock_result = this.lock_manager.acquire({
        agent_id: agent.id,
        paths: lock_paths.length > 0 ? lock_paths : undefined,
        categories: lock_categories.length > 0 ? lock_categories : undefined,
        lock_type: 'exclusive',
        ttl_ms: 300_000,
        descendants: true,
      });

      if (!lock_result.granted) {
        logger.warn({ agent_id: agent.id, conflicts: lock_result.conflicts }, 'Lock acquisition failed — waiting for release');
        // Wait up to 60s for conflicting locks to be released, then retry
        let retries = 0;
        while (!lock_result.granted && retries < 12) {
          retries++;
          await new Promise(resolve => setTimeout(resolve, 5000));
          const retry_result = this.lock_manager.acquire({
            agent_id: agent.id,
            paths: lock_paths.length > 0 ? lock_paths : undefined,
            categories: lock_categories.length > 0 ? lock_categories : undefined,
            lock_type: 'exclusive',
            ttl_ms: 300_000,
            descendants: true,
          });
          if (retry_result.granted) {
            agent.active_locks = retry_result.lock_ids;
            break;
          }
        }
        if (agent.active_locks.length === 0) {
          logger.error({ agent_id: agent.id }, 'Could not acquire locks after retries');
        }
      } else {
        agent.active_locks = lock_result.lock_ids;
      }
    }

    try {
      // Run the agent
      const result = await this.agent_runner.run(task, definition, {
        agent,
        mcp_client: this.mcp_client,
        tool_proxy: this.tool_proxy,
        lock_manager: this.lock_manager,
        message_bus: this.message_bus,
        task_queue: this.task_queue,
        ws_broadcast,
      });

      results.set(task.id, result);

      // Update task status
      this.task_queue.update(task.id, {
        status: result.success ? 'completed' : 'failed',
        result: result.result,
        error: result.error,
        completed_at: Date.now(),
      });
    } catch (error) {
      const error_msg = error instanceof Error ? error.message : 'Unknown error';
      results.set(task.id, {
        task_id: task.id,
        success: false,
        error: error_msg,
      });
      this.task_queue.update(task.id, {
        status: 'failed',
        error: error_msg,
        completed_at: Date.now(),
      });
    } finally {
      // Release locks and update agent status
      this.lock_manager.force_release(agent.id);
      // BUG FIX: Unregister agent from tool_proxy to prevent stale entries
      this.tool_proxy.unregister_agent(agent.id);
      agent.active_locks = [];
      agent.current_task_id = null;
      this.agent_registry.update_status(agent.id, 'idle');

      const final_task = this.task_queue.get(task.id);
      if (final_task) ws_broadcast(create_task_event(final_task, 'updated'));
      ws_broadcast(create_agent_status_event(agent));
    }
  }

  private extract_agent_type(task: AgentTask): AgentType | null {
    const match = task.description.match(/\[Agent Type: (\w+)\]/);
    if (match) {
      return AGENT_TYPE_MAP[match[1]] ?? null;
    }
    return null;
  }

  private synthesize_response(
    request: string,
    tasks: AgentTask[],
    results: Map<string, TaskResultPayload>,
  ): string {
    const completed = tasks.filter(t => t.status === 'completed');
    const failed = tasks.filter(t => t.status === 'failed');

    const sections: string[] = [];

    if (completed.length > 0) {
      sections.push(`Completed ${completed.length} of ${tasks.length} tasks:`);
      for (const task of completed) {
        const result = results.get(task.id);
        sections.push(`  - ${task.title}: ${typeof result?.result === 'string' ? result.result.slice(0, 200) : 'Done'}`);
      }
    }

    if (failed.length > 0) {
      sections.push(`\n${failed.length} task(s) failed:`);
      for (const task of failed) {
        sections.push(`  - ${task.title}: ${task.error ?? 'Unknown error'}`);
      }
    }

    if (tasks.length === 0) {
      sections.push('No tasks were needed for this request.');
    }

    return sections.join('\n');
  }
}
