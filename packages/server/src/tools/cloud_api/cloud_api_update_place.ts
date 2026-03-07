import type { ToolDefinition, ToolHandler } from '@roblox-studio-mcp/shared';
import { cloud_api_update_place_input } from '@roblox-studio-mcp/shared';
import { cloud_fetch } from './cloud_api_helpers.js';

export const definition: ToolDefinition = {
  name: 'cloud_api_update_place',
  description: 'Update place settings (name, description, max players, etc.).',
  input_schema: cloud_api_update_place_input,
  execution_layer: 'cloud',
  category: 'cloud_api',
  requires_session: false,
};

export const handler: ToolHandler = async (args) => {
  const { universe_id, place_id, ...body } = args as Record<string, unknown>;
  return cloud_fetch(`/cloud/v2/universes/${universe_id}/places/${place_id}`, { method: 'PATCH', body });
};
