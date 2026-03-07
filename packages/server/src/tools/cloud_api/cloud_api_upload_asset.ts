import type { ToolDefinition, ToolHandler } from '@roblox-studio-mcp/shared';
import { cloud_api_upload_asset_input } from '@roblox-studio-mcp/shared';
import { cloud_fetch } from './cloud_api_helpers.js';

export const definition: ToolDefinition = {
  name: 'cloud_api_upload_asset',
  description: 'Upload an asset (decal, audio, model, animation) to Roblox.',
  input_schema: cloud_api_upload_asset_input,
  execution_layer: 'cloud',
  category: 'cloud_api',
  requires_session: false,
};

export const handler: ToolHandler = async (args) => {
  const { asset_type, name, description, file_base64, group_id } = args as Record<string, unknown>;
  return cloud_fetch('/assets/v1/assets', {
    method: 'POST',
    body: {
      assetType: asset_type,
      displayName: name,
      description: description || '',
      creationContext: {
        creator: group_id ? { groupId: group_id } : undefined,
      },
      content: file_base64,
    },
  });
};
