import type { ToolDefinition, ToolHandler } from '@roblox-studio-mcp/shared';
import { cloud_api_send_notification_input } from '@roblox-studio-mcp/shared';
import { cloud_fetch } from './cloud_api_helpers.js';

export const definition: ToolDefinition = {
  name: 'cloud_api_send_notification',
  description: 'Send a notification to a user.',
  input_schema: cloud_api_send_notification_input,
  execution_layer: 'cloud',
  category: 'cloud_api',
  requires_session: false,
};

export const handler: ToolHandler = async (args) => {
  const { universe_id, user_id, payload } = args as Record<string, unknown>;
  return cloud_fetch(`/cloud/v2/universes/${universe_id}/user-notifications`, {
    method: 'POST',
    body: { source: { universe: `universes/${universe_id}` }, payload },
    query: { userId: user_id as string },
  });
};
