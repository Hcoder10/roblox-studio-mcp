import type { ToolDefinition, ToolHandler } from '@roblox-studio-mcp/shared';
import { cloud_api_publish_message_input } from '@roblox-studio-mcp/shared';
import { cloud_fetch } from './cloud_api_helpers.js';

export const definition: ToolDefinition = {
  name: 'cloud_api_publish_message',
  description: 'Publish a message to a MessagingService topic.',
  input_schema: cloud_api_publish_message_input,
  execution_layer: 'cloud',
  category: 'cloud_api',
  requires_session: false,
};

export const handler: ToolHandler = async (args) => {
  const { universe_id, topic, message } = args as { universe_id: string; topic: string; message: string };
  return cloud_fetch(`/messaging-service/v1/universes/${universe_id}/topics/${topic}`, {
    method: 'POST',
    body: { message },
  });
};
