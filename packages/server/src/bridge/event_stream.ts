import type { EventMessage } from '@roblox-studio-mcp/shared';

interface EventWaiter {
  resolve: (events: EventMessage[]) => void;
  timer: NodeJS.Timeout;
}

export class EventStream {
  private pending_events = new Map<string, EventMessage[]>();
  private waiters = new Map<string, EventWaiter>();

  push(session_token: string, event: EventMessage): void {
    const waiter = this.waiters.get(session_token);
    if (waiter) {
      clearTimeout(waiter.timer);
      this.waiters.delete(session_token);
      waiter.resolve([event]);
      return;
    }

    let events = this.pending_events.get(session_token);
    if (!events) {
      events = [];
      this.pending_events.set(session_token, events);
    }
    events.push(event);
  }

  async wait_for_events(session_token: string, timeout_ms: number): Promise<EventMessage[]> {
    const existing = this.pending_events.get(session_token);
    if (existing && existing.length > 0) {
      this.pending_events.set(session_token, []);
      return existing;
    }

    // If there's already a waiter for this session, resolve it empty first
    // to avoid orphaning the old promise
    const old_waiter = this.waiters.get(session_token);
    if (old_waiter) {
      clearTimeout(old_waiter.timer);
      old_waiter.resolve([]);
    }

    return new Promise<EventMessage[]>((resolve) => {
      const timer = setTimeout(() => {
        this.waiters.delete(session_token);
        resolve([]);
      }, timeout_ms);
      timer.unref();

      this.waiters.set(session_token, { resolve, timer });
    });
  }

  cleanup(session_token: string): void {
    this.pending_events.delete(session_token);
    const waiter = this.waiters.get(session_token);
    if (waiter) {
      clearTimeout(waiter.timer);
      this.waiters.delete(session_token);
    }
  }
}
