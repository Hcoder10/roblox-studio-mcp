import type { ToolDefinition, ToolHandler } from '@roblox-studio-mcp/shared';
import { cloud_api_get_inventory_input } from '@roblox-studio-mcp/shared';
import { cloud_fetch } from './cloud_api_helpers.js';

export const definition: ToolDefinition = {
  name: 'cloud_api_get_inventory',
  description: 'Get a user\'s inventory.',
  input_schema: cloud_api_get_inventory_input,
  execution_layer: 'cloud',
  category: 'cloud_api',
  requires_session: false,
};

export const handler: ToolHandler = async (args) => {
  const { user_id, asset_types, limit, cursor } = args as Record<string, unknown>;
  return cloud_fetch(`/cloud/v2/users/${user_id}/inventory-items`, {
    query: {
      maxPageSize: String(limit || 50),
      ...(cursor ? { pageToken: cursor as string } : {}),
      ...(asset_types ? { filter: `assetType in [${(asset_types as string[]).map(t => `'${t}'`).join(',')}]` } : {}),
    },
  });
};
