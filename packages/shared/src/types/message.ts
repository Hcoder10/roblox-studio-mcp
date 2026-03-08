export type AgentMessageType =
  | 'task_assign'
  | 'task_result'
  | 'lock_request'
  | 'lock_granted'
  | 'lock_denied'
  | 'feedback'
  | 'status_update'
  | 'abort'
  | 'chat';

export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  type: AgentMessageType;
  payload: unknown;
  timestamp: number;
}

export interface TaskAssignPayload {
  task_id: string;
  title: string;
  description: string;
  constraints?: string[];
  context?: Record<string, unknown>;
}

export interface TaskResultPayload {
  task_id: string;
  success: boolean;
  result?: unknown;
  error?: string;
  artifacts?: string[];
}

export interface FeedbackPayload {
  task_id?: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  suggestions?: string[];
}

export interface StatusUpdatePayload {
  agent_id: string;
  status: string;
  current_task?: string;
  progress?: number;
  message?: string;
}

// WebSocket events sent to browser UI
export type WsEventType =
  | 'user_message'
  | 'agent_thinking'
  | 'agent_tool_call'
  | 'agent_tool_result'
  | 'agent_message'
  | 'agent_action'
  | 'task_created'
  | 'task_updated'
  | 'lock_acquired'
  | 'lock_released'
  | 'lock_conflict'
  | 'screenshot_update'
  | 'agent_status_changed'
  | 'live_transcript'
  | 'live_audio'
  | 'error';

export interface WsEvent {
  type: WsEventType;
  payload: unknown;
  timestamp: number;
}
