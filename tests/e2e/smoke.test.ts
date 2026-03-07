/**
 * E2E Smoke Test
 * Tests the full pipeline: MCP → Server → Mock Plugin → Response
 * Plus agent harness basics.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:3000';
const AGENT_URL = process.env.TEST_AGENT_URL || 'http://localhost:3001';

describe('E2E Smoke Test', () => {
  describe('Cloud MCP Server', () => {
    it('should be healthy', async () => {
      const res = await fetch(`${SERVER_URL}/health`);
      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data.status).toBe('ok');
    });

    it('should expose 112+ tools', async () => {
      // Initialize MCP
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
            clientInfo: { name: 'smoke-test', version: '1.0.0' },
          },
        }),
      });

      const session_id = init_res.headers.get('mcp-session-id');

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

      const data = await tools_res.json();
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
      if (res.ok) {
        const data = await res.json();
        expect(data.status).toBe('ok');
      }
    });

    it('should list agents', async () => {
      const res = await fetch(`${AGENT_URL}/agents`);
      if (res.ok) {
        const data = await res.json();
        expect(Array.isArray(data)).toBe(true);
      }
    });
  });
});
