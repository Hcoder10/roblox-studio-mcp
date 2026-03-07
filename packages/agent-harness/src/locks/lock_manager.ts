import type {
  PathLock,
  CategoryLock,
  LockAcquireRequest,
  LockAcquireResult,
  LockConflict,
  LockReleaseRequest,
} from '@roblox-studio-mcp/shared';
import { TIMEOUTS } from '@roblox-studio-mcp/shared';
import { v4 as uuid } from 'uuid';
import pino from 'pino';

const logger = pino({ name: 'lock-manager' });

export class LockManager {
  private path_locks = new Map<string, PathLock>();
  private category_locks = new Map<string, CategoryLock>();
  private gc_interval: ReturnType<typeof setInterval>;

  constructor() {
    this.gc_interval = setInterval(() => this.gc(), 30_000);
  }

  destroy(): void {
    clearInterval(this.gc_interval);
  }

  acquire(request: LockAcquireRequest): LockAcquireResult {
    const conflicts = this.check_conflicts(request);
    if (conflicts.length > 0) {
      logger.warn(
        { agent: request.agent_id, conflicts: conflicts.length },
        'Lock acquisition denied due to conflicts',
      );
      return { granted: false, lock_ids: [], conflicts };
    }

    const lock_ids: string[] = [];
    const ttl = request.ttl_ms ?? TIMEOUTS.DEFAULT_LOCK_TTL;

    if (request.paths) {
      for (const path of request.paths) {
        const lock: PathLock = {
          id: uuid(),
          path,
          agent_id: request.agent_id,
          lock_type: request.lock_type,
          acquired_at: Date.now(),
          ttl_ms: ttl,
          descendants: request.descendants ?? true,
        };
        this.path_locks.set(lock.id, lock);
        lock_ids.push(lock.id);
        logger.info({ agent: request.agent_id, path, lock_id: lock.id }, 'Path lock acquired');
      }
    }

    if (request.categories) {
      for (const category of request.categories) {
        const lock: CategoryLock = {
          id: uuid(),
          category,
          agent_id: request.agent_id,
          lock_type: request.lock_type,
          acquired_at: Date.now(),
          ttl_ms: ttl,
        };
        this.category_locks.set(lock.id, lock);
        lock_ids.push(lock.id);
        logger.info({ agent: request.agent_id, category, lock_id: lock.id }, 'Category lock acquired');
      }
    }

    return { granted: true, lock_ids };
  }

  release(request: LockReleaseRequest): void {
    if (request.release_all) {
      this.force_release(request.agent_id);
      return;
    }

    if (request.lock_ids) {
      for (const lock_id of request.lock_ids) {
        const path_lock = this.path_locks.get(lock_id);
        if (path_lock && path_lock.agent_id === request.agent_id) {
          this.path_locks.delete(lock_id);
          logger.info({ lock_id, path: path_lock.path }, 'Path lock released');
          continue;
        }

        const cat_lock = this.category_locks.get(lock_id);
        if (cat_lock && cat_lock.agent_id === request.agent_id) {
          this.category_locks.delete(lock_id);
          logger.info({ lock_id, category: cat_lock.category }, 'Category lock released');
        }
      }
    }
  }

  force_release(agent_id: string): void {
    for (const [id, lock] of this.path_locks) {
      if (lock.agent_id === agent_id) {
        this.path_locks.delete(id);
      }
    }
    for (const [id, lock] of this.category_locks) {
      if (lock.agent_id === agent_id) {
        this.category_locks.delete(id);
      }
    }
    logger.info({ agent_id }, 'All locks force-released');
  }

  check_path(path: string, requester: string): boolean {
    for (const lock of this.path_locks.values()) {
      if (lock.agent_id === requester) continue;
      if (this.is_expired(lock)) continue;
      if (this.is_path_conflict(path, lock)) {
        return false;
      }
    }
    return true;
  }

  check_category(category: string, requester: string): boolean {
    for (const lock of this.category_locks.values()) {
      if (lock.agent_id === requester) continue;
      if (this.is_expired(lock)) continue;
      if (lock.category === category && lock.lock_type === 'exclusive') {
        return false;
      }
    }
    return true;
  }

  check_conflicts(request: LockAcquireRequest): LockConflict[] {
    const conflicts: LockConflict[] = [];

    if (request.paths) {
      for (const requested_path of request.paths) {
        for (const held of this.path_locks.values()) {
          if (held.agent_id === request.agent_id) continue;
          if (this.is_expired(held)) continue;

          if (this.is_path_conflict(requested_path, held)) {
            // Shared locks don't conflict with other shared locks
            if (request.lock_type === 'shared' && held.lock_type === 'shared') continue;

            conflicts.push({
              requested_resource: requested_path,
              held_by_agent: held.agent_id,
              held_lock_type: held.lock_type,
              held_since: held.acquired_at,
              expires_at: held.acquired_at + held.ttl_ms,
            });
          }
        }
      }
    }

    if (request.categories) {
      for (const requested_cat of request.categories) {
        for (const held of this.category_locks.values()) {
          if (held.agent_id === request.agent_id) continue;
          if (this.is_expired(held)) continue;

          if (held.category === requested_cat) {
            if (request.lock_type === 'shared' && held.lock_type === 'shared') continue;

            conflicts.push({
              requested_resource: requested_cat,
              held_by_agent: held.agent_id,
              held_lock_type: held.lock_type,
              held_since: held.acquired_at,
              expires_at: held.acquired_at + held.ttl_ms,
            });
          }
        }
      }
    }

    return conflicts;
  }

  gc(): void {
    let expired_count = 0;

    for (const [id, lock] of this.path_locks) {
      if (this.is_expired(lock)) {
        this.path_locks.delete(id);
        expired_count++;
      }
    }

    for (const [id, lock] of this.category_locks) {
      if (this.is_expired(lock)) {
        this.category_locks.delete(id);
        expired_count++;
      }
    }

    if (expired_count > 0) {
      logger.debug({ expired_count }, 'Expired locks collected');
    }
  }

  list(): { path_locks: PathLock[]; category_locks: CategoryLock[] } {
    return {
      path_locks: Array.from(this.path_locks.values()),
      category_locks: Array.from(this.category_locks.values()),
    };
  }

  get_agent_locks(agent_id: string): string[] {
    const lock_ids: string[] = [];
    for (const [id, lock] of this.path_locks) {
      if (lock.agent_id === agent_id) lock_ids.push(id);
    }
    for (const [id, lock] of this.category_locks) {
      if (lock.agent_id === agent_id) lock_ids.push(id);
    }
    return lock_ids;
  }

  private is_path_conflict(requested: string, held: PathLock): boolean {
    // Exact match
    if (requested === held.path) return true;

    // Hierarchical conflict: "Workspace.Map" conflicts with "Workspace.Map.Building1"
    // if the held lock covers descendants
    if (held.descendants) {
      // Held lock's path is ancestor of requested path
      if (requested.startsWith(held.path + '.')) return true;
    }

    // Requested path is ancestor of held path (always conflicts)
    if (held.path.startsWith(requested + '.')) return true;

    return false;
  }

  private is_expired(lock: { acquired_at: number; ttl_ms: number }): boolean {
    return Date.now() > lock.acquired_at + lock.ttl_ms;
  }
}
