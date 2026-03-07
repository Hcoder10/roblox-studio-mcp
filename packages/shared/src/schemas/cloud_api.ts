import { z } from 'zod';
import { pagination_schema } from './common.js';

// Universe / Place
export const cloud_api_list_universes_input = pagination_schema.extend({});

export const cloud_api_get_universe_input = z.object({
  universe_id: z.string(),
});

export const cloud_api_list_places_input = pagination_schema.extend({
  universe_id: z.string(),
});

export const cloud_api_get_place_input = z.object({
  universe_id: z.string(),
  place_id: z.string(),
});

export const cloud_api_update_place_input = z.object({
  universe_id: z.string(),
  place_id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  max_player_count: z.number().int().positive().optional(),
  allow_copying: z.boolean().optional(),
  social_slot_type: z.enum(['Automatic', 'Empty', 'Custom']).optional(),
});

export const cloud_api_publish_place_input = z.object({
  universe_id: z.string(),
  place_id: z.string(),
  version_type: z.enum(['Published', 'Saved']).optional().default('Published'),
});

// DataStores
export const cloud_api_list_datastores_input = z.object({
  universe_id: z.string(),
  prefix: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
  cursor: z.string().optional(),
});

export const cloud_api_get_datastore_entry_input = z.object({
  universe_id: z.string(),
  datastore_name: z.string(),
  key: z.string(),
  scope: z.string().optional().default('global'),
});

export const cloud_api_set_datastore_entry_input = z.object({
  universe_id: z.string(),
  datastore_name: z.string(),
  key: z.string(),
  value: z.unknown(),
  scope: z.string().optional().default('global'),
  exclusive_create: z.boolean().optional().default(false),
  match_version: z.string().optional(),
});

export const cloud_api_delete_datastore_entry_input = z.object({
  universe_id: z.string(),
  datastore_name: z.string(),
  key: z.string(),
  scope: z.string().optional().default('global'),
});

export const cloud_api_list_datastore_entries_input = z.object({
  universe_id: z.string(),
  datastore_name: z.string(),
  scope: z.string().optional().default('global'),
  prefix: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
  cursor: z.string().optional(),
  all_scopes: z.boolean().optional().default(false),
});

export const cloud_api_get_ordered_datastore_input = z.object({
  universe_id: z.string(),
  ordered_datastore_name: z.string(),
  scope: z.string().optional().default('global'),
  max_page_size: z.number().int().min(1).max(100).optional().default(50),
  order_by: z.enum(['asc', 'desc']).optional().default('desc'),
  cursor: z.string().optional(),
  filter: z.string().optional().describe('Filter expression, e.g. "entry >= 10 && entry <= 100"'),
});

export const cloud_api_set_ordered_datastore_input = z.object({
  universe_id: z.string(),
  ordered_datastore_name: z.string(),
  key: z.string(),
  value: z.number().int(),
  scope: z.string().optional().default('global'),
});

// Assets
export const cloud_api_upload_asset_input = z.object({
  asset_type: z.enum(['decal', 'audio', 'model', 'animation']),
  name: z.string(),
  description: z.string().optional(),
  file_base64: z.string().describe('Base64-encoded file content'),
  group_id: z.string().optional(),
});

export const cloud_api_get_asset_input = z.object({
  asset_id: z.string(),
});

export const cloud_api_list_assets_input = pagination_schema.extend({
  asset_type: z.string().optional(),
});

// Notifications
export const cloud_api_send_notification_input = z.object({
  universe_id: z.string(),
  user_id: z.string(),
  payload: z.object({
    message_id: z.string(),
    type: z.string(),
    parameters: z.record(z.string()).optional(),
  }),
});

// Users & Groups
export const cloud_api_get_user_input = z.object({
  user_id: z.string(),
});

export const cloud_api_get_group_input = z.object({
  group_id: z.string(),
});

export const cloud_api_list_group_members_input = pagination_schema.extend({
  group_id: z.string(),
});

// Messaging
export const cloud_api_get_messaging_input = z.object({
  universe_id: z.string(),
  topic: z.string(),
});

export const cloud_api_publish_message_input = z.object({
  universe_id: z.string(),
  topic: z.string(),
  message: z.string().max(1024),
});

// Subscriptions
export const cloud_api_list_subscriptions_input = pagination_schema.extend({
  universe_id: z.string(),
});

// Inventory
export const cloud_api_get_inventory_input = z.object({
  user_id: z.string(),
  asset_types: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
  cursor: z.string().optional(),
});

// Badges
export const cloud_api_list_badges_input = pagination_schema.extend({
  universe_id: z.string(),
});

export const cloud_api_award_badge_input = z.object({
  badge_id: z.string(),
  user_id: z.string(),
});

// Game Passes
export const cloud_api_get_game_passes_input = pagination_schema.extend({
  universe_id: z.string(),
});
