import type { Request, Response } from 'express';
import type { SessionManager } from '../bridge/session_manager.js';

const startTime = Date.now();

export function create_health_handler(session_manager: SessionManager, tool_count: number) {
  return (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      uptime_ms: Date.now() - startTime,
      sessions: session_manager.list().length,
      tools_registered: tool_count,
    });
  };
}
