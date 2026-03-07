import type { AgentDefinition, ToolResponse } from '@roblox-studio-mcp/shared';
import { TOOL_CATEGORIES } from '@roblox-studio-mcp/shared';
import type { McpClient } from './mcp_client.js';
import type { LockManager } from '../locks/lock_manager.js';
import pino from 'pino';

const logger = pino({ name: 'tool-proxy' });

// Tools that only read data and don't need lock checks
const READ_ONLY_TOOLS = new Set([
  'instance_get', 'instance_find', 'instance_get_property', 'instance_get_children',
  'script_get_source', 'script_find', 'script_list', 'script_require_graph',
  'execution_echo', 'execution_eval_expression', 'execution_get_globals',
  'playtest_get_status', 'playtest_get_player', 'playtest_get_output_log',
  'playtest_get_call_stack', 'playtest_get_variables',
  'terrain_read_voxels', 'terrain_get_material_colors',
  'diagnostics_get_stats', 'diagnostics_get_memory', 'diagnostics_get_network_stats',
  'diagnostics_get_physics_stats', 'diagnostics_get_render_stats',
  'diagnostics_profile_get_data', 'diagnostics_get_log', 'diagnostics_get_output',
  'ui_get_tree', 'ui_preview',
  'record_get_status', 'record_list', 'record_replay_get_status',
  'animation_get_length', 'animation_list',
  'session_status',
  'luau_parse', 'luau_analyze', 'luau_format', 'luau_lint', 'luau_get_ast',
]);

export class ToolProxy {
  private agent_definitions = new Map<string, AgentDefinition>();

  constructor(
    private mcp_client: McpClient,
    private lock_manager: LockManager,
  ) {}

  register_agent(agent_id: string, definition: AgentDefinition): void {
    this.agent_definitions.set(agent_id, definition);
  }

  unregister_agent(agent_id: string): void {
    this.agent_definitions.delete(agent_id);
  }

  async call_tool(
    agent_id: string,
    tool_name: string,
    args: Record<string, unknown>,
  ): Promise<ToolResponse> {
    // 1. Check if agent is allowed to call this tool
    if (!this.is_tool_allowed(agent_id, tool_name)) {
      logger.warn({ agent_id, tool_name }, 'Tool call denied: not in allowed list');
      return {
        success: false,
        error: {
          code: 'AGENT_TOOL_DENIED',
          message: `Agent ${agent_id} is not allowed to call tool '${tool_name}'`,
          layer: 'server',
          tool: tool_name,
          retryable: false,
        },
      };
    }

    // 2. For write operations, check if agent holds required locks
    if (!READ_ONLY_TOOLS.has(tool_name)) {
      const path = this.extract_path_from_args(args);
      if (path && !this.lock_manager.check_path(path, agent_id)) {
        logger.warn({ agent_id, tool_name, path }, 'Tool call denied: lock not held');
        return {
          success: false,
          error: {
            code: 'LOCK_NOT_HELD',
            message: `Agent must hold a lock on '${path}' to use '${tool_name}'`,
            layer: 'server',
            tool: tool_name,
            retryable: true,
          },
        };
      }

      const category = this.get_tool_category(tool_name);
      if (category && !this.lock_manager.check_category(category, agent_id)) {
        logger.warn({ agent_id, tool_name, category }, 'Tool call denied: category lock not held');
        return {
          success: false,
          error: {
            code: 'LOCK_NOT_HELD',
            message: `Agent must hold a category lock on '${category}' to use '${tool_name}'`,
            layer: 'server',
            tool: tool_name,
            retryable: true,
          },
        };
      }
    }

    // 3. Call MCP client
    logger.debug({ agent_id, tool_name }, 'Proxying tool call to MCP server');
    return this.mcp_client.call_tool(tool_name, args);
  }

  get_allowed_tools(agent_id: string): string[] {
    const definition = this.agent_definitions.get(agent_id);
    if (!definition) return [];

    const tools = new Set<string>();

    // Add explicitly allowed tools
    for (const tool of definition.allowed_tools) {
      tools.add(tool);
    }

    // Add tools from allowed categories
    for (const category of definition.allowed_categories) {
      const cat_tools = TOOL_CATEGORIES[category];
      if (cat_tools) {
        for (const tool of cat_tools) {
          tools.add(tool);
        }
      }
    }

    return Array.from(tools);
  }

  private is_tool_allowed(agent_id: string, tool_name: string): boolean {
    const allowed = this.get_allowed_tools(agent_id);
    return allowed.includes(tool_name);
  }

  private extract_path_from_args(args: Record<string, unknown>): string | null {
    // Common arg names that specify instance paths
    if (typeof args.path === 'string') return args.path;
    if (typeof args.parent_path === 'string') return args.parent_path;
    if (typeof args.target_path === 'string') return args.target_path;
    if (typeof args.source_path === 'string') return args.source_path;
    if (typeof args.destination_path === 'string') return args.destination_path;
    return null;
  }

  private get_tool_category(tool_name: string): string | null {
    for (const [category, tools] of Object.entries(TOOL_CATEGORIES)) {
      if (tools.includes(tool_name)) return category;
    }
    return null;
  }
}
