import type { WsEvent, AgentInstance, AgentTask, PathLock, CategoryLock } from '@roblox-studio-mcp/shared';

export function create_tool_call_event(
  agent_id: string,
  tool_call_id: string,
  tool_name: string,
  args: unknown,
): WsEvent {
  const safe_args = (args && typeof args === 'object')
    ? (args as Record<string, unknown>)
    : {};

  return {
    type: 'agent_tool_call',
    payload: {
      agent_id,
      tool_call_id,
      tool_name,
      args: safe_args,
      tool_call: {
        id: tool_call_id,
        tool_name,
        args: safe_args,
        status: 'pending',
      },
    },
    timestamp: Date.now(),
  };
}

export function create_agent_status_event(agent: AgentInstance): WsEvent {
  const model = `${agent.definition.model.provider}/${agent.definition.model.model}`;
  return {
    type: 'agent_status_changed',
    payload: {
      id: agent.id,
      agent_id: agent.id,
      type: agent.definition.type,
      agent_type: agent.definition.type,
      status: agent.status,
      current_task: agent.current_task_id,
      current_task_id: agent.current_task_id,
      model,
      active_locks: agent.active_locks,
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
      id: task.id,
      task_id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      assigned_to: task.assigned_to,
      created_by: task.created_by,
      priority: task.priority,
      dependencies: task.dependencies,
      error: task.error,
      created_at: task.created_at,
      started_at: task.started_at,
      completed_at: task.completed_at,
    },
    timestamp: Date.now(),
  };
}

export function create_lock_event(
  lock: PathLock | CategoryLock,
  action: 'acquired' | 'released' | 'conflict',
): WsEvent {
  const resource = 'path' in lock ? (lock as PathLock).path : (lock as CategoryLock).category;
  return {
    type: action === 'acquired'
      ? 'lock_acquired'
      : action === 'released'
        ? 'lock_released'
        : 'lock_conflict',
    payload: {
      id: lock.id,
      lock_id: lock.id,
      agent_id: lock.agent_id,
      lock_type: lock.lock_type,
      resource,
      resource_type: 'path' in lock ? 'path' : 'category',
      path: 'path' in lock ? resource : undefined,
      category: 'category' in lock ? resource : undefined,
      acquired_at: lock.acquired_at,
      ttl_ms: lock.ttl_ms,
      descendants: 'path' in lock ? (lock as PathLock).descendants : undefined,
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
