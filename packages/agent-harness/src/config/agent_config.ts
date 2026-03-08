import type { AgentDefinition } from '@roblox-studio-mcp/shared';
import { orchestrator_definition } from '../agents/definitions/orchestrator.js';
import { planning_definition } from '../agents/definitions/planning.js';
import { building_lead_definition } from '../agents/definitions/building_lead.js';
import { scripting_lead_definition } from '../agents/definitions/scripting_lead.js';
import { visual_lead_definition } from '../agents/definitions/visual_lead.js';
import { video_analysis_definition } from '../agents/definitions/video_analysis.js';
import { worker_building_definition } from '../agents/definitions/worker_building.js';
import { worker_scripting_definition } from '../agents/definitions/worker_scripting.js';
import { worker_vfx_definition } from '../agents/definitions/worker_vfx.js';
import { worker_texture_definition } from '../agents/definitions/worker_texture.js';
import { testing_agent_definition } from '../agents/definitions/testing_agent.js';
import { texture_generator_definition } from '../agents/definitions/texture_generator.js';

export function get_default_definitions(): AgentDefinition[] {
  return [
    orchestrator_definition,
    planning_definition,
    building_lead_definition,
    scripting_lead_definition,
    visual_lead_definition,
    video_analysis_definition,
    worker_building_definition,
    worker_scripting_definition,
    worker_vfx_definition,
    worker_texture_definition,
    testing_agent_definition,
    texture_generator_definition,
  ];
}

export {
  orchestrator_definition,
  planning_definition,
  building_lead_definition,
  scripting_lead_definition,
  visual_lead_definition,
  video_analysis_definition,
  worker_building_definition,
  worker_scripting_definition,
  worker_vfx_definition,
  worker_texture_definition,
  testing_agent_definition,
  texture_generator_definition,
};
