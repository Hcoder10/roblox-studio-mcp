import type { ToolDefinition, ToolHandler } from '@roblox-studio-mcp/shared';
import { cloud_api_get_datastore_entry_input } from '@roblox-studio-mcp/shared';
import { cloud_fetch } from './cloud_api_helpers.js';

export const definition: ToolDefinition = {
  name: 'cloud_api_get_datastore_entry',
  description: 'Get a DataStore entry by key.',
  input_schema: cloud_api_get_datastore_entry_input,
  execution_layer: 'cloud',
  category: 'cloud_api',
  requires_session: false,
};

export const handler: ToolHandler = async (args) => {
  const { universe_id, datastore_name, key, scope } = args as { universe_id: string; datastore_name: string; key: string; scope?: string };
  return cloud_fetch(`/datastores/v1/universes/${universe_id}/standard-datastores/datastore/entries/entry`, {
    query: { datastoreName: datastore_name, entryKey: key, scope: scope || 'global' },
  });
};
