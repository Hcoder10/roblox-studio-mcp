import { useEffect, useState } from 'react';
import type { Lock, WsEvent } from '../types';

type RawLock = Partial<Lock> & {
  id?: string;
  lock_id?: string;
  resource?: string;
  resource_type?: 'path' | 'category';
};

function toLock(data: RawLock): Lock | null {
  const id = data.id ?? data.lock_id;
  if (!id) return null;

  const resourcePath =
    data.path ?? (data.resource_type === 'path' ? data.resource : undefined);
  const resourceCategory =
    data.category ?? (data.resource_type === 'category' ? data.resource : undefined);

  return {
    id,
    path: resourcePath,
    category: resourceCategory,
    agent_id: data.agent_id ?? 'unknown',
    lock_type: data.lock_type ?? 'shared',
    acquired_at: data.acquired_at ?? Date.now(),
    ttl_ms: data.ttl_ms ?? 300_000,
    descendants: data.descendants,
  };
}

export function useLocks(lastEvent: WsEvent | null) {
  const [locks, setLocks] = useState<Lock[]>([]);

  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.type === 'agent_status_changed') {
      const payload = lastEvent.payload as { locks?: RawLock[] };
      if (payload && Array.isArray(payload.locks)) {
        setLocks(payload.locks.map(toLock).filter((lock): lock is Lock => lock != null));
      }
      return;
    }

    if (lastEvent.type === 'lock_acquired') {
      const payload = lastEvent.payload as RawLock | RawLock[];
      if (Array.isArray(payload)) {
        setLocks(payload.map(toLock).filter((lock): lock is Lock => lock != null));
        return;
      }

      const lock = toLock(payload);
      if (!lock) return;

      setLocks((prev) => {
        if (prev.some((l) => l.id === lock.id)) return prev;
        return [...prev, lock];
      });
    }

    if (lastEvent.type === 'lock_released') {
      const data = lastEvent.payload as { lock_ids?: string[]; id?: string; lock_id?: string };
      const lockIds = data.lock_ids
        ?? [data.id ?? data.lock_id].filter((id): id is string => id != null);
      setLocks((prev) => prev.filter((l) => !lockIds.includes(l.id)));
    }
  }, [lastEvent]);

  return { locks };
}
