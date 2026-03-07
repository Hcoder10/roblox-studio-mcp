import type { ToolDefinition, ToolHandler } from '@roblox-studio-mcp/shared';
import { cloud_api_publish_place_input } from '@roblox-studio-mcp/shared';
import { cloud_fetch } from './cloud_api_helpers.js';

export const definition: ToolDefinition = {
  name: 'cloud_api_publish_place',
  description: 'Publish a place version.',
  input_schema: cloud_api_publish_place_input,
  execution_layer: 'cloud',
  category: 'cloud_api',
  requires_session: false,
};

export const handler: ToolHandler = async (args) => {
  const { universe_id, place_id, version_type } = args as { universe_id: string; place_id: string; version_type?: string };
  return cloud_fetch(`/universes/v1/${universe_id}/places/${place_id}/versions`, {
    method: 'POST',
    query: { versionType: version_type || 'Published' },
  });
};
