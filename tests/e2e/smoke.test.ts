/**
 * E2E Smoke Test
 * Tests the full pipeline: MCP → Server → Mock Plugin → Response
 * Plus agent harness basics.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:3000';
const AGENT_URL = process.env.TEST_AGENT_URL || 'http://localhost:3001';

async function read_rpc_response(res: Response): Promise<any> {
  const body = await res.text();
  if (body.trim().startsWith('event:')) {
    const data_line = body
      .split('\n')
      .find((line) => line.startsWith('data: '));
    if (!data_line) throw new Error('Missing SSE data line');
    return JSON.parse(data_line.slice(6));
  }
  return JSON.parse(body);
}

async function initialize_session(client_name: string): Promise<string> {
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
        clientInfo: { name: client_name, version: '1.0.0' },
      },
    }),
  });
  expect(init_res.ok).toBe(true);

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

  return session_id!;
}

describe('E2E Smoke Test', () => {
  describe('Cloud MCP Server', () => {
    it('should be healthy', async () => {
      const res = await fetch(`${SERVER_URL}/health`);
      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data.status).toBe('ok');
    });

    it('should expose 112+ tools', async () => {
      const session_id = await initialize_session('smoke-test');

      // List tools
      const tools_res = await fetch(`${SERVER_URL}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
          'mcp-session-id': session_id!,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/list',
          params: {},
        }),
      });

      const data = await read_rpc_response(tools_res);
      const tools = data.result.tools;

      expect(tools.length).toBeGreaterThanOrEqual(112);

      // Verify key tools exist
      const tool_names = tools.map((t: { name: string }) => t.name);
      expect(tool_names).toContain('execution_echo');
      expect(tool_names).toContain('instance_create');
      expect(tool_names).toContain('script_create');
      expect(tool_names).toContain('session_connect');
    });
  });

  describe('Agent Harness', () => {
    it('should be healthy', async () => {
      const res = await fetch(`${AGENT_URL}/health`);
      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data.status).toBe('ok');
    });

    it('should list agents', async () => {
      const res = await fetch(`${AGENT_URL}/agents`);
      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(Array.isArray(data.definitions)).toBe(true);
      expect(Array.isArray(data.instances)).toBe(true);
    });
  });
});
