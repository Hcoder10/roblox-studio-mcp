import type { ToolDefinition, ToolHandler } from '@roblox-studio-mcp/shared';
import { cloud_api_get_group_input } from '@roblox-studio-mcp/shared';
import { cloud_fetch } from './cloud_api_helpers.js';

export const definition: ToolDefinition = {
  name: 'cloud_api_get_group',
  description: 'Get group information by group ID.',
  input_schema: cloud_api_get_group_input,
  execution_layer: 'cloud',
  category: 'cloud_api',
  requires_session: false,
};

export const handler: ToolHandler = async (args) => {
  const { group_id } = args as { group_id: string };
  return cloud_fetch(`/cloud/v2/groups/${group_id}`);
};
