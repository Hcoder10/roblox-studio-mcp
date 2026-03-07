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
  | 'worker_texture';

export type AgentStatus = 'idle' | 'thinking' | 'executing' | 'blocked' | 'error' | 'terminated';

export type ModelProvider = 'gemini' | 'openai' | 'anthropic';

export interface ModelConfig {
  provider: ModelProvider;
  model: string;
  temperature: number;
  max_tokens: number;
  api_key_env: string;
}

export interface AgentDefinition {
  id: string;
  type: AgentType;
  model: ModelConfig;
  system_prompt: string;
  allowed_tools: string[];
  allowed_categories: string[];
  parent_id: string | null;
  max_concurrent_tasks: number;
  lock_scope: LockScope;
}

export interface LockScope {
  allowed_paths: string[];
  allowed_categories: string[];
}

export interface AgentInstance {
  id: string;
  definition: AgentDefinition;
  status: AgentStatus;
  current_task_id: string | null;
  active_locks: string[];
  created_at: number;
  last_activity: number;
  error?: string;
}

export interface AgentTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  assigned_to: string | null;
  created_by: string;
  priority: number;
  dependencies: string[];
  result?: unknown;
  error?: string;
  created_at: number;
  started_at?: number;
  completed_at?: number;
}
