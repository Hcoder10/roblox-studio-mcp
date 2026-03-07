import type { ToolDefinition, ToolHandler } from '@roblox-studio-mcp/shared';
import { cloud_api_get_universe_input } from '@roblox-studio-mcp/shared';
import { cloud_fetch } from './cloud_api_helpers.js';

export const definition: ToolDefinition = {
  name: 'cloud_api_get_universe',
  description: 'Get details of a specific universe (game).',
  input_schema: cloud_api_get_universe_input,
  execution_layer: 'cloud',
  category: 'cloud_api',
  requires_session: false,
};

export const handler: ToolHandler = async (args) => {
  const { universe_id } = args as { universe_id: string };
  return cloud_fetch(`/cloud/v2/universes/${universe_id}`);
};
