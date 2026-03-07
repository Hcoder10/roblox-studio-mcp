import type { ToolDefinition, ToolHandler } from '@roblox-studio-mcp/shared';
import { cloud_api_set_datastore_entry_input } from '@roblox-studio-mcp/shared';
import { cloud_fetch } from './cloud_api_helpers.js';

export const definition: ToolDefinition = {
  name: 'cloud_api_set_datastore_entry',
  description: 'Set a DataStore entry value.',
  input_schema: cloud_api_set_datastore_entry_input,
  execution_layer: 'cloud',
  category: 'cloud_api',
  requires_session: false,
};

export const handler: ToolHandler = async (args) => {
  const { universe_id, datastore_name, key, value, scope, exclusive_create, match_version } = args as Record<string, unknown>;
  return cloud_fetch(`/datastores/v1/universes/${universe_id}/standard-datastores/datastore/entries/entry`, {
    method: 'POST',
    query: {
      datastoreName: datastore_name as string,
      entryKey: key as string,
      scope: (scope as string) || 'global',
      ...(exclusive_create ? { exclusiveCreate: 'true' } : {}),
      ...(match_version ? { matchVersion: match_version as string } : {}),
    },
    body: value,
  });
};
