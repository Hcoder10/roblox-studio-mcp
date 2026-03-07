import type { Request, Response, NextFunction } from 'express';

interface RateEntry {
  count: number;
  reset_at: number;
}

export function create_rate_limiter(max_requests: number, window_ms = 60_000) {
  const entries = new Map<string, RateEntry>();

  // Clean up every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of entries) {
      if (entry.reset_at <= now) entries.delete(key);
    }
  }, 300_000).unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    let entry = entries.get(ip);

    if (!entry || entry.reset_at <= now) {
      entry = { count: 0, reset_at: now + window_ms };
      entries.set(ip, entry);
    }

    entry.count++;

    if (entry.count > max_requests) {
      res.status(429).json({
        success: false,
        error: {
          code: 'SERVER_RATE_LIMITED',
          message: `Rate limit exceeded. Max ${max_requests} requests per ${window_ms / 1000}s.`,
          layer: 'server' as const,
          retryable: true,
        },
      });
      return;
    }

    next();
  };
}
