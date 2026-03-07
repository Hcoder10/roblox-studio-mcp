export interface CommandEnvelope {
  id: string;
  tool: string;
  args: Record<string, unknown>;
  timestamp: number;
  timeout_ms: number;
}

export interface CommandResult {
  command_id: string;
  success: boolean;
  result?: unknown;
  error_message?: string;
  execution_time_ms: number;
}

export interface BridgeSession {
  token: string;
  created_at: number;
  last_heartbeat: number;
  studio_version?: string;
  place_id?: string;
  mcp_session_linked: boolean;
}

export interface RegisterRequest {
  token: string;
  studio_version?: string;
  place_id?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
}

export interface PollResponse {
  has_command: boolean;
  command?: CommandEnvelope;
}

export interface RespondRequest {
  token: string;
  command_id: string;
  success: boolean;
  result?: unknown;
  error_message?: string;
}

export interface HeartbeatRequest {
  token: string;
}

export interface HeartbeatResponse {
  success: boolean;
  session_age_ms: number;
}

export interface EventMessage {
  type: string;
  payload: unknown;
  timestamp: number;
}
