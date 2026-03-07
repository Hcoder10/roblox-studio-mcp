import type { ToolDefinition, ToolHandler } from '@roblox-studio-mcp/shared';
import { cloud_api_list_universes_input } from '@roblox-studio-mcp/shared';
import { cloud_fetch } from './cloud_api_helpers.js';

export const definition: ToolDefinition = {
  name: 'cloud_api_list_universes',
  description: 'List universes (games) accessible to the authenticated user.',
  input_schema: cloud_api_list_universes_input,
  execution_layer: 'cloud',
  category: 'cloud_api',
  requires_session: false,
};

export const handler: ToolHandler = async (args) => {
  const { cursor, limit } = args as { cursor?: string; limit?: number };
  return cloud_fetch('/cloud/v2/universes', {
    query: {
      maxPageSize: String(limit || 50),
      ...(cursor ? { pageToken: cursor } : {}),
    },
  });
};
