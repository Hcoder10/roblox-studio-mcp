export type AgentType =
  | 'orchestrator'
  | 'planning'
  | 'building_lead'
  | 'scripting_lead'
  | 'visual_lead'
  | 'video_analysis'
  | 'worker_building'
  | 'worker_scripting'
  | 'worker_vfx'
  | 'worker_texture'
  | 'testing'
  | 'texture_generator';

export type AgentStatus = 'idle' | 'thinking' | 'executing' | 'blocked' | 'error' | 'terminated';

export interface Agent {
  id: string;
  type: AgentType;
  status: AgentStatus;
  current_task?: string;
  model: string;
  active_locks: string[];
  error?: string;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assigned_to: string | null;
  created_by: string;
  priority: number;
  dependencies: string[];
  error?: string;
  created_at: number;
  started_at?: number;
  completed_at?: number;
}

export type LockType = 'exclusive' | 'shared';

export interface Lock {
  id: string;
  path?: string;
  category?: string;
  agent_id: string;
  lock_type: LockType;
  acquired_at: number;
  ttl_ms: number;
  descendants?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  agent_id?: string;
  agent_type?: AgentType;
  content: string;
  tool_calls?: ToolCall[];
  timestamp: number;
}

export interface ToolCall {
  id: string;
  tool_name: string;
  args: Record<string, unknown>;
  result?: unknown;
  status: 'pending' | 'success' | 'error';
  duration_ms?: number;
}

export type WsEventType =
  | 'user_message'
  | 'agent_thinking'
  | 'agent_tool_call'
  | 'agent_tool_result'
  | 'agent_message'
  | 'task_created'
  | 'task_updated'
  | 'lock_acquired'
  | 'lock_released'
  | 'lock_conflict'
  | 'screenshot_update'
  | 'agent_status_changed'
  | 'agent_action'
  | 'live_transcript'
  | 'live_audio'
  | 'error';

export interface WsEvent {
  type: WsEventType;
  payload: unknown;
  timestamp: number;
}

export interface AgentAction {
  id: string;
  agent_id: string;
  agent_type: AgentType;
  action: string;
  tool_name?: string;
  tool_args?: Record<string, unknown>;
  result?: string;
  status: 'started' | 'completed' | 'error';
  timestamp: number;
  duration_ms?: number;
}
