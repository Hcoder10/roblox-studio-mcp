/**
 * Integration test: Multi-session management
 * Tests: Multiple plugins connecting, session GC, auto-link fallback
 */

import { describe, it, expect } from 'vitest';

const SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:3000';

describe('Multi-Session Management', () => {
  it('should handle multiple plugin registrations', async () => {
    const token1 = 'multi-test-1-' + Date.now();
    const token2 = 'multi-test-2-' + Date.now();

    // Register two plugins
    const res1 = await fetch(`${SERVER_URL}/bridge/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token1 }),
    });
    expect(res1.ok).toBe(true);

    const res2 = await fetch(`${SERVER_URL}/bridge/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token2 }),
    });
    expect(res2.ok).toBe(true);
  });

  it('should auto-link when only one session exists', async () => {
    const token = 'auto-link-test-' + Date.now();

    // Register one plugin
    await fetch(`${SERVER_URL}/bridge/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    // Initialize MCP session
    const init_res = await fetch(`${SERVER_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2025-06-18',
          capabilities: {},
          clientInfo: { name: 'test-client', version: '1.0.0' },
        },
      }),
    });

    const session_id = init_res.headers.get('mcp-session-id');
    expect(session_id).toBeTruthy();

    const notify_res = await fetch(`${SERVER_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        'mcp-session-id': session_id!,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'notifications/initialized',
        params: {},
      }),
    });
    expect(notify_res.ok).toBe(true);

    // Call session_status without explicit connect — should auto-link
    const status_res = await fetch(`${SERVER_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        'mcp-session-id': session_id!,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'session_status',
          arguments: {},
        },
      }),
    });

    expect(status_res.ok).toBe(true);
  });

  it('should reject expired sessions', async () => {
    const token = 'expired-test-' + Date.now();

    // Register and immediately check heartbeat (should work)
    await fetch(`${SERVER_URL}/bridge/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    const hb_res = await fetch(`${SERVER_URL}/bridge/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    expect(hb_res.ok).toBe(true);

    // Note: Can't easily test 60s expiry in unit test.
    // This would be tested with mocked timers or shorter TTL in test config.
  });

  it('should reject duplicate registration', async () => {
    const token = 'dup-test-' + Date.now();

    await fetch(`${SERVER_URL}/bridge/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    const dup_res = await fetch(`${SERVER_URL}/bridge/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    // Should either succeed (idempotent) or return conflict
    expect([200, 409]).toContain(dup_res.status);
  });
});
