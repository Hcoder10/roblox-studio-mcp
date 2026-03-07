import type { ToolDefinition, ToolHandler } from '@roblox-studio-mcp/shared';
import { cloud_api_set_ordered_datastore_input } from '@roblox-studio-mcp/shared';
import { cloud_fetch } from './cloud_api_helpers.js';

export const definition: ToolDefinition = {
  name: 'cloud_api_set_ordered_datastore',
  description: 'Set a value in an Ordered DataStore.',
  input_schema: cloud_api_set_ordered_datastore_input,
  execution_layer: 'cloud',
  category: 'cloud_api',
  requires_session: false,
};

export const handler: ToolHandler = async (args) => {
  const { universe_id, ordered_datastore_name, key, value, scope } = args as Record<string, unknown>;
  return cloud_fetch(`/ordered-data-stores/v1/universes/${universe_id}/orderedDataStores/${ordered_datastore_name}/scopes/${scope || 'global'}/entries`, {
    method: 'POST',
    query: { id: key as string },
    body: { value },
  });
};
