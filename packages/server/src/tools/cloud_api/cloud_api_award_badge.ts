import type { ToolDefinition, ToolHandler } from '@roblox-studio-mcp/shared';
import { cloud_api_award_badge_input } from '@roblox-studio-mcp/shared';
import { cloud_fetch } from './cloud_api_helpers.js';

export const definition: ToolDefinition = {
  name: 'cloud_api_award_badge',
  description: 'Award a badge to a user.',
  input_schema: cloud_api_award_badge_input,
  execution_layer: 'cloud',
  category: 'cloud_api',
  requires_session: false,
};

export const handler: ToolHandler = async (args) => {
  const { badge_id, user_id } = args as { badge_id: string; user_id: string };
  return cloud_fetch(`/cloud/v2/badges/${badge_id}:award`, {
    method: 'POST',
    body: { userId: user_id },
  });
};
