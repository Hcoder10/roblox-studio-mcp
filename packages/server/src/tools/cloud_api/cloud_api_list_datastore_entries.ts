import type { ToolDefinition, ToolHandler } from '@roblox-studio-mcp/shared';
import { cloud_api_list_datastore_entries_input } from '@roblox-studio-mcp/shared';
import { cloud_fetch } from './cloud_api_helpers.js';

export const definition: ToolDefinition = {
  name: 'cloud_api_list_datastore_entries',
  description: 'List entries in a DataStore.',
  input_schema: cloud_api_list_datastore_entries_input,
  execution_layer: 'cloud',
  category: 'cloud_api',
  requires_session: false,
};

export const handler: ToolHandler = async (args) => {
  const { universe_id, datastore_name, scope, prefix, limit, cursor, all_scopes } = args as Record<string, unknown>;
  return cloud_fetch(`/datastores/v1/universes/${universe_id}/standard-datastores/datastore/entries`, {
    query: {
      datastoreName: datastore_name as string,
      scope: (scope as string) || 'global',
      ...(prefix ? { prefix: prefix as string } : {}),
      limit: String(limit || 50),
      ...(cursor ? { cursor: cursor as string } : {}),
      ...(all_scopes ? { AllScopes: 'true' } : {}),
    },
  });
};
