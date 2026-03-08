import type { BridgeSession, RegisterRequest } from '@roblox-studio-mcp/shared';
import { TIMEOUTS } from '@roblox-studio-mcp/shared';
import { logger } from '../util/logger.js';

export type SessionCleanupCallback = (token: string) => void;

export class SessionManager {
  private sessions = new Map<string, BridgeSession>();
  private gc_timer: NodeJS.Timeout;
  private cleanup_callbacks: SessionCleanupCallback[] = [];

  constructor() {
    this.gc_timer = setInterval(() => this.gc(), TIMEOUTS.SESSION_GC_INTERVAL);
    this.gc_timer.unref();
  }

  /** Register a callback invoked when a session is removed (GC or manual). */
  on_session_cleanup(cb: SessionCleanupCallback): void {
    this.cleanup_callbacks.push(cb);
  }

  private notify_cleanup(token: string): void {
    for (const cb of this.cleanup_callbacks) {
      try {
        cb(token);
      } catch {
        // cleanup callbacks must not throw into GC
      }
    }
  }

  register(token: string, info: RegisterRequest): void {
    const session: BridgeSession = {
      token,
      created_at: Date.now(),
      last_heartbeat: Date.now(),
      studio_version: info.studio_version,
      place_id: info.place_id,
      mcp_session_linked: false,
    };
    this.sessions.set(token, session);
    logger.info({ token, place_id: info.place_id }, 'Bridge session registered');
  }

  get(token: string): BridgeSession | undefined {
    return this.sessions.get(token);
  }

  heartbeat(token: string): boolean {
    const session = this.sessions.get(token);
    if (!session) return false;
    session.last_heartbeat = Date.now();
    return true;
  }

  link_mcp_session(token: string): void {
    const session = this.sessions.get(token);
    if (session) {
      session.mcp_session_linked = true;
      logger.info({ token }, 'MCP session linked to bridge session');
    }
  }

  unlink_mcp_session(token: string): void {
    const session = this.sessions.get(token);
    if (session) {
      session.mcp_session_linked = false;
      logger.info({ token }, 'MCP session unlinked from bridge session');
    }
  }

  gc(): void {
    const now = Date.now();
    for (const [token, session] of this.sessions) {
      if (now - session.last_heartbeat > TIMEOUTS.SESSION_EXPIRY) {
        this.sessions.delete(token);
        this.notify_cleanup(token);
        logger.info({ token }, 'Bridge session expired');
      }
    }
  }

  get_single_session(): BridgeSession | undefined {
    if (this.sessions.size === 1) {
      return this.sessions.values().next().value;
    }
    return undefined;
  }

  list(): BridgeSession[] {
    return Array.from(this.sessions.values());
  }

  destroy(): void {
    clearInterval(this.gc_timer);
  }
}
