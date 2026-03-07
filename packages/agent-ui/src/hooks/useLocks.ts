import { useEffect, useState } from 'react';
import type { Lock, WsEvent } from '../types';

export function useLocks(lastEvent: WsEvent | null) {
  const [locks, setLocks] = useState<Lock[]>([]);

  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.type === 'lock_acquired') {
      const lock = lastEvent.payload as Lock;
      setLocks((prev) => {
        if (prev.some((l) => l.id === lock.id)) return prev;
        return [...prev, lock];
      });
    }

    if (lastEvent.type === 'lock_released') {
      const data = lastEvent.payload as { lock_ids: string[] };
      setLocks((prev) => prev.filter((l) => !data.lock_ids.includes(l.id)));
    }
  }, [lastEvent]);

  return { locks };
}
