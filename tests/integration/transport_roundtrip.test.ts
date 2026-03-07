/**
 * Integration test: Full transport round-trip
 * Tests: MCP client → Cloud Server → Plugin (mock) → Response
 *
 * This simulates the complete pipeline without needing a real Roblox Studio instance.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:3000';
const PLUGIN_TOKEN = 'test-session-' + Date.now();

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

describe('Transport Round-Trip', () => {
  // Register a mock plugin session
  beforeAll(async () => {
    const res = await fetch(`${SERVER_URL}/bridge/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: PLUGIN_TOKEN,
        studio_version: '0.600.0',
        place_id: '12345',
      }),
    });
    expect(res.ok).toBe(true);
  });

  it('should echo through full pipeline', async () => {
    // Start a mock plugin poll loop in the background
    const plugin_loop = async () => {
      const poll_res = await fetch(
        `${SERVER_URL}/bridge/poll?token=${PLUGIN_TOKEN}`,
      );
      const poll_data = await poll_res.json();

      if (poll_data.has_command) {
        const command = poll_data.command;
        expect(command.tool).toBe('execution_echo');

        // Respond with the echoed message
        await fetch(`${SERVER_URL}/bridge/respond`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: PLUGIN_TOKEN,
            command_id: command.id,
            success: true,
            result: { message: command.args.message },
          }),
        });
      }
    };

    // Run plugin poll in parallel with MCP tool call
    const plugin_promise = plugin_loop();

    // Call execution_echo via MCP
    // First, initialize MCP session
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
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test-client', version: '1.0.0' },
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

    // Connect session to plugin
    const connect_res = await fetch(`${SERVER_URL}/mcp`, {
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
          name: 'session_connect',
          arguments: { token: PLUGIN_TOKEN },
        },
      }),
    });
    expect(connect_res.ok).toBe(true);

    // Call execution_echo
    const echo_res = await fetch(`${SERVER_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        'mcp-session-id': session_id!,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'execution_echo',
          arguments: { message: 'Hello from integration test!' },
        },
      }),
    });

    await plugin_promise;

    expect(echo_res.ok).toBe(true);
    const echo_data = await read_rpc_response(echo_res);
    expect(echo_data.result).toBeDefined();

    const content = echo_data.result.content[0];
    expect(content.type).toBe('text');

    const result = JSON.parse(content.text);
    expect(result.success).toBe(true);
    expect(result.data.message).toBe('Hello from integration test!');
  });

  it('should handle session heartbeat', async () => {
    const res = await fetch(`${SERVER_URL}/bridge/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: PLUGIN_TOKEN }),
    });
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.session_age_ms).toBeGreaterThan(0);
  });

  it('should return health check', async () => {
    const res = await fetch(`${SERVER_URL}/health`);
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.status).toBe('ok');
    expect(data.tools_registered).toBeGreaterThan(0);
  });

  it('should list tools via MCP', async () => {
    const res = await fetch(`${SERVER_URL}/mcp`, {
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
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test-client', version: '1.0.0' },
        },
      }),
    });

    const session_id = res.headers.get('mcp-session-id');

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

    expect(tools_res.ok).toBe(true);
    const tools_data = await read_rpc_response(tools_res);
    expect(tools_data.result.tools.length).toBeGreaterThanOrEqual(112);
  });
});
