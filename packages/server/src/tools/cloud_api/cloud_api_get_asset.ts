import type { ToolDefinition, ToolHandler } from '@roblox-studio-mcp/shared';
import { cloud_api_get_asset_input } from '@roblox-studio-mcp/shared';
import { cloud_fetch } from './cloud_api_helpers.js';

export const definition: ToolDefinition = {
  name: 'cloud_api_get_asset',
  description: 'Get details of an asset by ID.',
  input_schema: cloud_api_get_asset_input,
  execution_layer: 'cloud',
  category: 'cloud_api',
  requires_session: false,
};

export const handler: ToolHandler = async (args) => {
  const { asset_id } = args as { asset_id: string };
  return cloud_fetch(`/assets/v1/assets/${asset_id}`);
};
