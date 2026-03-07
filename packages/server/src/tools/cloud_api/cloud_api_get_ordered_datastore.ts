import type { ToolDefinition, ToolHandler } from '@roblox-studio-mcp/shared';
import { cloud_api_get_ordered_datastore_input } from '@roblox-studio-mcp/shared';
import { cloud_fetch } from './cloud_api_helpers.js';

export const definition: ToolDefinition = {
  name: 'cloud_api_get_ordered_datastore',
  description: 'Get sorted entries from an Ordered DataStore.',
  input_schema: cloud_api_get_ordered_datastore_input,
  execution_layer: 'cloud',
  category: 'cloud_api',
  requires_session: false,
};

export const handler: ToolHandler = async (args) => {
  const { universe_id, ordered_datastore_name, scope, max_page_size, order_by, cursor, filter } = args as Record<string, unknown>;
  return cloud_fetch(`/ordered-data-stores/v1/universes/${universe_id}/orderedDataStores/${ordered_datastore_name}/scopes/${scope || 'global'}/entries`, {
    query: {
      max_page_size: String(max_page_size || 50),
      order_by: (order_by as string) || 'desc',
      ...(cursor ? { page_token: cursor as string } : {}),
      ...(filter ? { filter: filter as string } : {}),
    },
  });
};
