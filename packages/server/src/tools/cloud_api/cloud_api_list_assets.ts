import type { ToolDefinition, ToolHandler } from '@roblox-studio-mcp/shared';
import { cloud_api_list_assets_input } from '@roblox-studio-mcp/shared';
import { cloud_fetch } from './cloud_api_helpers.js';

export const definition: ToolDefinition = {
  name: 'cloud_api_list_assets',
  description: 'List assets, optionally filtered by type.',
  input_schema: cloud_api_list_assets_input,
  execution_layer: 'cloud',
  category: 'cloud_api',
  requires_session: false,
};

export const handler: ToolHandler = async (args) => {
  const { asset_type, cursor, limit } = args as Record<string, unknown>;
  return cloud_fetch('/assets/v1/assets', {
    query: {
      maxPageSize: String(limit || 50),
      ...(asset_type ? { assetType: asset_type as string } : {}),
      ...(cursor ? { pageToken: cursor as string } : {}),
    },
  });
};
