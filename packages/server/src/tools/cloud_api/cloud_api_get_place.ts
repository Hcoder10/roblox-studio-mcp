import type { ToolDefinition, ToolHandler } from '@roblox-studio-mcp/shared';
import { cloud_api_get_place_input } from '@roblox-studio-mcp/shared';
import { cloud_fetch } from './cloud_api_helpers.js';

export const definition: ToolDefinition = {
  name: 'cloud_api_get_place',
  description: 'Get details of a specific place in a universe.',
  input_schema: cloud_api_get_place_input,
  execution_layer: 'cloud',
  category: 'cloud_api',
  requires_session: false,
};

export const handler: ToolHandler = async (args) => {
  const { universe_id, place_id } = args as { universe_id: string; place_id: string };
  return cloud_fetch(`/cloud/v2/universes/${universe_id}/places/${place_id}`);
};
