import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolModule } from '@roblox-studio-mcp/shared';
import { TOOL_CATEGORIES } from '@roblox-studio-mcp/shared';
import type { ServerToolContext } from './context.js';
import { logger } from '../util/logger.js';
import type { ZodObject, ZodRawShape } from 'zod';

// Static imports for all tool modules organized by category
import * as session_connect from './session/session_connect.js';
import * as session_disconnect from './session/session_disconnect.js';
import * as session_status from './session/session_status.js';

import * as instance_create from './instance/instance_create.js';
import * as instance_delete from './instance/instance_delete.js';
import * as instance_clone from './instance/instance_clone.js';
import * as instance_move from './instance/instance_move.js';
import * as instance_get from './instance/instance_get.js';
import * as instance_find from './instance/instance_find.js';
import * as instance_set_property from './instance/instance_set_property.js';
import * as instance_get_property from './instance/instance_get_property.js';
import * as instance_get_children from './instance/instance_get_children.js';

import * as script_create from './script/script_create.js';
import * as script_get_source from './script/script_get_source.js';
import * as script_set_source from './script/script_set_source.js';
import * as script_find from './script/script_find.js';
import * as script_list from './script/script_list.js';
import * as script_require_graph from './script/script_require_graph.js';
import * as script_insert_snippet from './script/script_insert_snippet.js';
import * as script_replace_section from './script/script_replace_section.js';
import * as script_validate_syntax from './script/script_validate_syntax.js';

import * as execution_echo from './execution/execution_echo.js';
import * as execution_run_luau from './execution/execution_run_luau.js';
import * as execution_eval_expression from './execution/execution_eval_expression.js';
import * as execution_call_function from './execution/execution_call_function.js';
import * as execution_get_globals from './execution/execution_get_globals.js';
import * as execution_set_global from './execution/execution_set_global.js';
import * as execution_require_module from './execution/execution_require_module.js';

import * as playtest_start from './playtest/playtest_start.js';
import * as playtest_stop from './playtest/playtest_stop.js';
import * as playtest_get_status from './playtest/playtest_get_status.js';
import * as playtest_simulate_input from './playtest/playtest_simulate_input.js';
import * as playtest_get_player from './playtest/playtest_get_player.js';
import * as playtest_get_output_log from './playtest/playtest_get_output_log.js';
import * as playtest_set_breakpoint from './playtest/playtest_set_breakpoint.js';
import * as playtest_remove_breakpoint from './playtest/playtest_remove_breakpoint.js';
import * as playtest_step_debugger from './playtest/playtest_step_debugger.js';
import * as playtest_get_call_stack from './playtest/playtest_get_call_stack.js';
import * as playtest_get_variables from './playtest/playtest_get_variables.js';

import * as terrain_generate from './terrain/terrain_generate.js';
import * as terrain_fill_region from './terrain/terrain_fill_region.js';
import * as terrain_fill_ball from './terrain/terrain_fill_ball.js';
import * as terrain_fill_cylinder from './terrain/terrain_fill_cylinder.js';
import * as terrain_fill_wedge from './terrain/terrain_fill_wedge.js';
import * as terrain_read_voxels from './terrain/terrain_read_voxels.js';
import * as terrain_write_voxels from './terrain/terrain_write_voxels.js';
import * as terrain_clear from './terrain/terrain_clear.js';
import * as terrain_get_material_colors from './terrain/terrain_get_material_colors.js';

import * as animation_create_keyframe_sequence from './animation/animation_create_keyframe_sequence.js';
import * as animation_add_keyframe from './animation/animation_add_keyframe.js';
import * as animation_remove_keyframe from './animation/animation_remove_keyframe.js';
import * as animation_set_keyframe_pose from './animation/animation_set_keyframe_pose.js';
import * as animation_play_preview from './animation/animation_play_preview.js';
import * as animation_stop_preview from './animation/animation_stop_preview.js';
import * as animation_import from './animation/animation_import.js';
import * as animation_export from './animation/animation_export.js';
import * as animation_get_length from './animation/animation_get_length.js';
import * as animation_list from './animation/animation_list.js';

import * as diagnostics_get_stats from './diagnostics/diagnostics_get_stats.js';
import * as diagnostics_get_memory from './diagnostics/diagnostics_get_memory.js';
import * as diagnostics_get_network_stats from './diagnostics/diagnostics_get_network_stats.js';
import * as diagnostics_get_physics_stats from './diagnostics/diagnostics_get_physics_stats.js';
import * as diagnostics_get_render_stats from './diagnostics/diagnostics_get_render_stats.js';
import * as diagnostics_profile_start from './diagnostics/diagnostics_profile_start.js';
import * as diagnostics_profile_stop from './diagnostics/diagnostics_profile_stop.js';
import * as diagnostics_profile_get_data from './diagnostics/diagnostics_profile_get_data.js';
import * as diagnostics_get_log from './diagnostics/diagnostics_get_log.js';
import * as diagnostics_get_output from './diagnostics/diagnostics_get_output.js';

import * as ui_create_screen_gui from './ui_builder/ui_create_screen_gui.js';
import * as ui_create_element from './ui_builder/ui_create_element.js';
import * as ui_set_layout from './ui_builder/ui_set_layout.js';
import * as ui_apply_style from './ui_builder/ui_apply_style.js';
import * as ui_create_template from './ui_builder/ui_create_template.js';
import * as ui_instantiate_template from './ui_builder/ui_instantiate_template.js';
import * as ui_get_tree from './ui_builder/ui_get_tree.js';
import * as ui_preview from './ui_builder/ui_preview.js';

import * as record_start from './record_replay/record_start.js';
import * as record_stop from './record_replay/record_stop.js';
import * as record_get_status from './record_replay/record_get_status.js';
import * as record_list from './record_replay/record_list.js';
import * as record_replay_start from './record_replay/record_replay_start.js';
import * as record_replay_stop from './record_replay/record_replay_stop.js';
import * as record_replay_get_status from './record_replay/record_replay_get_status.js';
import * as record_export from './record_replay/record_export.js';
import * as record_delete from './record_replay/record_delete.js';

import * as cloud_api_list_universes from './cloud_api/cloud_api_list_universes.js';
import * as cloud_api_get_universe from './cloud_api/cloud_api_get_universe.js';
import * as cloud_api_list_places from './cloud_api/cloud_api_list_places.js';
import * as cloud_api_get_place from './cloud_api/cloud_api_get_place.js';
import * as cloud_api_update_place from './cloud_api/cloud_api_update_place.js';
import * as cloud_api_publish_place from './cloud_api/cloud_api_publish_place.js';
import * as cloud_api_list_datastores from './cloud_api/cloud_api_list_datastores.js';
import * as cloud_api_get_datastore_entry from './cloud_api/cloud_api_get_datastore_entry.js';
import * as cloud_api_set_datastore_entry from './cloud_api/cloud_api_set_datastore_entry.js';
import * as cloud_api_delete_datastore_entry from './cloud_api/cloud_api_delete_datastore_entry.js';
import * as cloud_api_list_datastore_entries from './cloud_api/cloud_api_list_datastore_entries.js';
import * as cloud_api_get_ordered_datastore from './cloud_api/cloud_api_get_ordered_datastore.js';
import * as cloud_api_set_ordered_datastore from './cloud_api/cloud_api_set_ordered_datastore.js';
import * as cloud_api_upload_asset from './cloud_api/cloud_api_upload_asset.js';
import * as cloud_api_get_asset from './cloud_api/cloud_api_get_asset.js';
import * as cloud_api_list_assets from './cloud_api/cloud_api_list_assets.js';
import * as cloud_api_send_notification from './cloud_api/cloud_api_send_notification.js';
import * as cloud_api_get_user from './cloud_api/cloud_api_get_user.js';
import * as cloud_api_get_group from './cloud_api/cloud_api_get_group.js';
import * as cloud_api_list_group_members from './cloud_api/cloud_api_list_group_members.js';
import * as cloud_api_get_messaging from './cloud_api/cloud_api_get_messaging.js';
import * as cloud_api_publish_message from './cloud_api/cloud_api_publish_message.js';
import * as cloud_api_list_subscriptions from './cloud_api/cloud_api_list_subscriptions.js';
import * as cloud_api_get_inventory from './cloud_api/cloud_api_get_inventory.js';
import * as cloud_api_list_badges from './cloud_api/cloud_api_list_badges.js';
import * as cloud_api_award_badge from './cloud_api/cloud_api_award_badge.js';
import * as cloud_api_get_game_passes from './cloud_api/cloud_api_get_game_passes.js';

import * as luau_parse from './luau_parser/luau_parse.js';
import * as luau_analyze from './luau_parser/luau_analyze.js';
import * as luau_format from './luau_parser/luau_format.js';
import * as luau_lint from './luau_parser/luau_lint.js';
import * as luau_get_ast from './luau_parser/luau_get_ast.js';
import * as luau_transform from './luau_parser/luau_transform.js';

const ALL_TOOLS: ToolModule[] = [
  session_connect, session_disconnect, session_status,
  instance_create, instance_delete, instance_clone, instance_move,
  instance_get, instance_find, instance_set_property, instance_get_property, instance_get_children,
  script_create, script_get_source, script_set_source, script_find, script_list,
  script_require_graph, script_insert_snippet, script_replace_section, script_validate_syntax,
  execution_echo, execution_run_luau, execution_eval_expression,
  execution_call_function, execution_get_globals, execution_set_global, execution_require_module,
  playtest_start, playtest_stop, playtest_get_status, playtest_simulate_input,
  playtest_get_player, playtest_get_output_log, playtest_set_breakpoint,
  playtest_remove_breakpoint, playtest_step_debugger, playtest_get_call_stack, playtest_get_variables,
  terrain_generate, terrain_fill_region, terrain_fill_ball, terrain_fill_cylinder,
  terrain_fill_wedge, terrain_read_voxels, terrain_write_voxels, terrain_clear, terrain_get_material_colors,
  animation_create_keyframe_sequence, animation_add_keyframe, animation_remove_keyframe,
  animation_set_keyframe_pose, animation_play_preview, animation_stop_preview,
  animation_import, animation_export, animation_get_length, animation_list,
  diagnostics_get_stats, diagnostics_get_memory, diagnostics_get_network_stats,
  diagnostics_get_physics_stats, diagnostics_get_render_stats, diagnostics_profile_start,
  diagnostics_profile_stop, diagnostics_profile_get_data, diagnostics_get_log, diagnostics_get_output,
  ui_create_screen_gui, ui_create_element, ui_set_layout, ui_apply_style,
  ui_create_template, ui_instantiate_template, ui_get_tree, ui_preview,
  record_start, record_stop, record_get_status, record_list,
  record_replay_start, record_replay_stop, record_replay_get_status, record_export, record_delete,
  cloud_api_list_universes, cloud_api_get_universe, cloud_api_list_places, cloud_api_get_place,
  cloud_api_update_place, cloud_api_publish_place, cloud_api_list_datastores,
  cloud_api_get_datastore_entry, cloud_api_set_datastore_entry, cloud_api_delete_datastore_entry,
  cloud_api_list_datastore_entries, cloud_api_get_ordered_datastore, cloud_api_set_ordered_datastore,
  cloud_api_upload_asset, cloud_api_get_asset, cloud_api_list_assets, cloud_api_send_notification,
  cloud_api_get_user, cloud_api_get_group, cloud_api_list_group_members,
  cloud_api_get_messaging, cloud_api_publish_message, cloud_api_list_subscriptions,
  cloud_api_get_inventory, cloud_api_list_badges, cloud_api_award_badge, cloud_api_get_game_passes,
  luau_parse, luau_analyze, luau_format, luau_lint, luau_get_ast, luau_transform,
];

export function register_all_tools(mcp: McpServer, context: ServerToolContext): number {
  let count = 0;

  for (const tool of ALL_TOOLS) {
    const { definition: def, handler } = tool;
    // MCP SDK expects ZodRawShape (.shape), not the ZodObject itself
    const schema = (def.input_schema as ZodObject<ZodRawShape>).shape;
    mcp.tool(
      def.name,
      def.description,
      schema,
      async (args) => {
        const result = await handler(args as Record<string, unknown>, context);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result) }],
        };
      },
    );
    count++;
  }

  logger.info({ count }, 'All tools registered');
  return count;
}
