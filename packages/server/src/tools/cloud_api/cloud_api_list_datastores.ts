import type { ToolDefinition, ToolHandler } from '@roblox-studio-mcp/shared';
import { cloud_api_list_datastores_input } from '@roblox-studio-mcp/shared';
import { cloud_fetch } from './cloud_api_helpers.js';

export const definition: ToolDefinition = {
  name: 'cloud_api_list_datastores',
  description: 'List DataStores in a universe.',
  input_schema: cloud_api_list_datastores_input,
  execution_layer: 'cloud',
  category: 'cloud_api',
  requires_session: false,
};

export const handler: ToolHandler = async (args) => {
  const { universe_id, prefix, limit, cursor } = args as { universe_id: string; prefix?: string; limit?: number; cursor?: string };
  return cloud_fetch(`/datastores/v1/universes/${universe_id}/standard-datastores`, {
    query: {
      ...(prefix ? { prefix } : {}),
      limit: String(limit || 50),
      ...(cursor ? { cursor } : {}),
    },
  });
};
