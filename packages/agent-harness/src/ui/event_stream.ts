import type { WsEvent, AgentInstance, AgentTask, PathLock, CategoryLock } from '@roblox-studio-mcp/shared';

export function create_tool_call_event(
  agent_id: string,
  tool_name: string,
  args: unknown,
): WsEvent {
  return {
    type: 'agent_tool_call',
    payload: {
      agent_id,
      tool_name,
      args,
    },
    timestamp: Date.now(),
  };
}

export function create_agent_status_event(agent: AgentInstance): WsEvent {
  return {
    type: 'agent_status_changed',
    payload: {
      agent_id: agent.id,
      agent_type: agent.definition.type,
      status: agent.status,
      current_task_id: agent.current_task_id,
      error: agent.error,
    },
    timestamp: Date.now(),
  };
}

export function create_task_event(
  task: AgentTask,
  action: 'created' | 'updated',
): WsEvent {
  return {
    type: action === 'created' ? 'task_created' : 'task_updated',
    payload: {
      task_id: task.id,
      title: task.title,
      status: task.status,
      assigned_to: task.assigned_to,
      priority: task.priority,
      dependencies: task.dependencies,
      result: task.result,
      error: task.error,
    },
    timestamp: Date.now(),
  };
}

export function create_lock_event(
  lock: PathLock | CategoryLock,
  action: 'acquired' | 'released' | 'conflict',
): WsEvent {
  return {
    type: action === 'acquired'
      ? 'lock_acquired'
      : action === 'released'
        ? 'lock_released'
        : 'lock_conflict',
    payload: {
      lock_id: lock.id,
      agent_id: lock.agent_id,
      lock_type: lock.lock_type,
      resource: 'path' in lock ? (lock as PathLock).path : (lock as CategoryLock).category,
      resource_type: 'path' in lock ? 'path' : 'category',
    },
    timestamp: Date.now(),
  };
}

export function create_error_event(message: string, details?: unknown): WsEvent {
  return {
    type: 'error',
    payload: { message, details },
    timestamp: Date.now(),
  };
}
