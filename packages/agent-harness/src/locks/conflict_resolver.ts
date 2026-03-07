import type { LockConflict } from '@roblox-studio-mcp/shared';
import pino from 'pino';

const logger = pino({ name: 'conflict-resolver' });

export type ConflictResolution = 'wait' | 'reassign' | 'force_release';

export class ConflictResolver {
  /** Maximum time to wait for a lock before escalating (ms) */
  private max_wait_ms = 30_000;

  async resolve(
    conflicts: LockConflict[],
    requesting_agent: string,
  ): Promise<ConflictResolution> {
    if (conflicts.length === 0) return 'wait';

    // Check if all conflicting locks will expire soon
    const now = Date.now();
    const all_expire_soon = conflicts.every(c => c.expires_at - now < this.max_wait_ms);

    if (all_expire_soon) {
      const max_wait = Math.max(...conflicts.map(c => c.expires_at - now));
      logger.info(
        { requesting_agent, wait_ms: max_wait },
        'Conflicts will resolve soon, recommending wait',
      );
      return 'wait';
    }

    // Check if conflicts are from multiple agents (complex situation — reassign)
    const conflicting_agents = new Set(conflicts.map(c => c.held_by_agent));
    if (conflicting_agents.size > 1) {
      logger.info(
        { requesting_agent, conflicting_agents: Array.from(conflicting_agents) },
        'Multiple agents hold conflicting locks, recommending reassign',
      );
      return 'reassign';
    }

    // Single agent holds the lock and it won't expire soon
    // Check lock age — if very old, it might be stale
    const oldest = Math.min(...conflicts.map(c => c.held_since));
    const lock_age = now - oldest;

    if (lock_age > 5 * 60 * 1000) {
      // Lock held for more than 5 minutes — likely stale
      logger.warn(
        { requesting_agent, lock_age_ms: lock_age },
        'Lock appears stale, recommending force release',
      );
      return 'force_release';
    }

    // Default: wait for the lock holder to finish
    logger.info({ requesting_agent }, 'Recommending wait for lock release');
    return 'wait';
  }
}
