import type { ToolDefinition, ToolHandler } from '@roblox-studio-mcp/shared';
import { cloud_api_get_game_passes_input } from '@roblox-studio-mcp/shared';
import { cloud_fetch } from './cloud_api_helpers.js';

export const definition: ToolDefinition = {
  name: 'cloud_api_get_game_passes',
  description: 'List game passes for a universe.',
  input_schema: cloud_api_get_game_passes_input,
  execution_layer: 'cloud',
  category: 'cloud_api',
  requires_session: false,
};

export const handler: ToolHandler = async (args) => {
  const { universe_id, cursor, limit } = args as Record<string, unknown>;
  return cloud_fetch(`/cloud/v2/universes/${universe_id}/game-passes`, {
    query: {
      maxPageSize: String(limit || 50),
      ...(cursor ? { pageToken: cursor as string } : {}),
    },
  });
};
