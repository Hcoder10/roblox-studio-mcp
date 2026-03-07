import type {
  AgentDefinition,
  AgentInstance,
  AgentStatus,
  AgentType,
} from '@roblox-studio-mcp/shared';
import { v4 as uuid } from 'uuid';
import pino from 'pino';

const logger = pino({ name: 'agent-registry' });

export class AgentRegistry {
  private agents = new Map<string, AgentInstance>();
  private definitions = new Map<string, AgentDefinition>();

  register_definition(def: AgentDefinition): void {
    this.definitions.set(def.id, def);
    logger.info({ id: def.id, type: def.type }, 'Agent definition registered');
  }

  get_definition(id: string): AgentDefinition | undefined {
    return this.definitions.get(id);
  }

  get_definitions(): AgentDefinition[] {
    return Array.from(this.definitions.values());
  }

  spawn(definition_id: string): AgentInstance {
    const definition = this.definitions.get(definition_id);
    if (!definition) {
      throw new Error(`No definition found: ${definition_id}`);
    }

    const instance: AgentInstance = {
      id: uuid(),
      definition,
      status: 'idle',
      current_task_id: null,
      active_locks: [],
      created_at: Date.now(),
      last_activity: Date.now(),
    };

    this.agents.set(instance.id, instance);
    logger.info(
      { instance_id: instance.id, definition_id, type: definition.type },
      'Agent spawned',
    );
    return instance;
  }

  get(id: string): AgentInstance | undefined {
    return this.agents.get(id);
  }

  update_status(id: string, status: AgentStatus): void {
    const agent = this.agents.get(id);
    if (agent) {
      agent.status = status;
      agent.last_activity = Date.now();
    }
  }

  terminate(id: string): void {
    const agent = this.agents.get(id);
    if (agent) {
      agent.status = 'terminated';
      logger.info({ id, type: agent.definition.type }, 'Agent terminated');
    }
  }

  list(): AgentInstance[] {
    return Array.from(this.agents.values()).filter(a => a.status !== 'terminated');
  }

  get_by_type(type: AgentType): AgentInstance[] {
    return this.list().filter(a => a.definition.type === type);
  }

  find_idle_by_type(type: AgentType): AgentInstance | undefined {
    return this.list().find(a => a.definition.type === type && a.status === 'idle');
  }
}
