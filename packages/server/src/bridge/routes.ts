import { Router } from 'express';
import type { RegisterRequest, RespondRequest, HeartbeatRequest } from '@roblox-studio-mcp/shared';
import { TIMEOUTS } from '@roblox-studio-mcp/shared';
import type { SessionManager } from './session_manager.js';
import type { CommandQueue } from './command_queue.js';
import type { EventStream } from './event_stream.js';
import { logger } from '../util/logger.js';

export function create_bridge_router(
  session_manager: SessionManager,
  command_queue: CommandQueue,
  event_stream: EventStream,
): Router {
  const router = Router();

  // POST /bridge/register
  router.post('/register', (req, res) => {
    const body = req.body as RegisterRequest;
    if (!body.token) {
      res.status(400).json({ success: false, message: 'Missing token' });
      return;
    }

    session_manager.register(body.token, body);
    res.json({ success: true, message: 'Session registered' });
  });

  // GET /bridge/poll?token=TOKEN
  router.get('/poll', async (req, res) => {
    const token = req.query.token as string;
    if (!token) {
      res.status(400).json({ has_command: false, error: 'Missing token' });
      return;
    }

    const session = session_manager.get(token);
    if (!session) {
      res.status(404).json({ has_command: false, error: 'Session not found' });
      return;
    }

    // Check for immediate command
    const command = command_queue.poll(token);
    if (command) {
      res.json({ has_command: true, command });
      return;
    }

    // Short-poll: wait up to 2s for a command
    const start = Date.now();
    const poll_interval = 100;
    const poll_timeout = 2000;

    const check = (): void => {
      const cmd = command_queue.poll(token);
      if (cmd) {
        res.json({ has_command: true, command: cmd });
        return;
      }
      if (Date.now() - start >= poll_timeout) {
        res.json({ has_command: false });
        return;
      }
      setTimeout(check, poll_interval);
    };

    setTimeout(check, poll_interval);
  });

  // POST /bridge/respond
  router.post('/respond', (req, res) => {
    const body = req.body as RespondRequest;
    if (!body.command_id || !body.token) {
      res.status(400).json({ success: false, message: 'Missing command_id or token' });
      return;
    }

    const session = session_manager.get(body.token);
    if (!session) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }

    command_queue.respond(body.command_id, {
      command_id: body.command_id,
      success: body.success,
      result: body.result,
      error_message: body.error_message,
      execution_time_ms: 0,
    });

    res.json({ success: true });
  });

  // POST /bridge/heartbeat
  router.post('/heartbeat', (req, res) => {
    const body = req.body as HeartbeatRequest;
    if (!body.token) {
      res.status(400).json({ success: false, message: 'Missing token' });
      return;
    }

    const ok = session_manager.heartbeat(body.token);
    if (!ok) {
      res.status(404).json({ success: false, session_age_ms: 0 });
      return;
    }

    const session = session_manager.get(body.token)!;
    res.json({
      success: true,
      session_age_ms: Date.now() - session.created_at,
    });
  });

  // GET /bridge/events?token=TOKEN
  router.get('/events', async (req, res) => {
    const token = req.query.token as string;
    if (!token) {
      res.status(400).json({ events: [], error: 'Missing token' });
      return;
    }

    const session = session_manager.get(token);
    if (!session) {
      res.status(404).json({ events: [], error: 'Session not found' });
      return;
    }

    const events = await event_stream.wait_for_events(token, TIMEOUTS.LONG_POLL);
    res.json({ events });
  });

  return router;
}
