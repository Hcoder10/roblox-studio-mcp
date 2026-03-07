import type { AgentTask } from '@roblox-studio-mcp/shared';
import pino from 'pino';

const logger = pino({ name: 'task-queue' });

export class TaskQueue {
  private tasks = new Map<string, AgentTask>();

  add(task: AgentTask): void {
    this.tasks.set(task.id, task);
    logger.info({ task_id: task.id, title: task.title }, 'Task added');
  }

  get(id: string): AgentTask | undefined {
    return this.tasks.get(id);
  }

  update(id: string, updates: Partial<AgentTask>): void {
    const task = this.tasks.get(id);
    if (!task) {
      logger.warn({ task_id: id }, 'Attempted to update non-existent task');
      return;
    }
    Object.assign(task, updates);
    logger.debug({ task_id: id, status: task.status }, 'Task updated');
  }

  get_pending(): AgentTask[] {
    return Array.from(this.tasks.values()).filter(t => t.status === 'pending');
  }

  get_by_agent(agent_id: string): AgentTask[] {
    return Array.from(this.tasks.values()).filter(t => t.assigned_to === agent_id);
  }

  get_blocked(): AgentTask[] {
    return Array.from(this.tasks.values()).filter(t => {
      if (t.status !== 'pending') return false;
      return t.dependencies.some(dep_id => {
        const dep = this.tasks.get(dep_id);
        return !dep || dep.status !== 'completed';
      });
    });
  }

  get_ready(): AgentTask[] {
    return Array.from(this.tasks.values()).filter(t => {
      if (t.status !== 'pending') return false;
      if (t.assigned_to) return false;
      return t.dependencies.every(dep_id => {
        const dep = this.tasks.get(dep_id);
        return dep && dep.status === 'completed';
      });
    });
  }

  list(): AgentTask[] {
    return Array.from(this.tasks.values());
  }

  remove(id: string): void {
    this.tasks.delete(id);
  }
}
