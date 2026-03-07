export type LockType = 'exclusive' | 'shared';

export interface PathLock {
  id: string;
  path: string;
  agent_id: string;
  lock_type: LockType;
  acquired_at: number;
  ttl_ms: number;
  descendants: boolean;
}

export interface CategoryLock {
  id: string;
  category: string;
  agent_id: string;
  lock_type: LockType;
  acquired_at: number;
  ttl_ms: number;
}

export interface LockAcquireRequest {
  agent_id: string;
  paths?: string[];
  categories?: string[];
  lock_type: LockType;
  ttl_ms?: number;
  descendants?: boolean;
}

export interface LockAcquireResult {
  granted: boolean;
  lock_ids: string[];
  conflicts?: LockConflict[];
}

export interface LockConflict {
  requested_resource: string;
  held_by_agent: string;
  held_lock_type: LockType;
  held_since: number;
  expires_at: number;
}

export interface LockReleaseRequest {
  agent_id: string;
  lock_ids?: string[];
  release_all?: boolean;
}
