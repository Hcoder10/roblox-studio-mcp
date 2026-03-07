import type { ToolDefinition, ToolHandler } from '@roblox-studio-mcp/shared';
import { cloud_api_get_user_input } from '@roblox-studio-mcp/shared';
import { cloud_fetch } from './cloud_api_helpers.js';

export const definition: ToolDefinition = {
  name: 'cloud_api_get_user',
  description: 'Get user information by user ID.',
  input_schema: cloud_api_get_user_input,
  execution_layer: 'cloud',
  category: 'cloud_api',
  requires_session: false,
};

export const handler: ToolHandler = async (args) => {
  const { user_id } = args as { user_id: string };
  return cloud_fetch(`/cloud/v2/users/${user_id}`);
};
