import type { CommandEnvelope, CommandResult, CommandQueueInterface } from '@roblox-studio-mcp/shared';
import { TIMEOUTS } from '@roblox-studio-mcp/shared';
import { logger } from '../util/logger.js';

interface PendingCommand {
  command: CommandEnvelope;
  resolve: (result: CommandResult) => void;
  reject: (error: Error) => void;
  timer: NodeJS.Timeout;
}

export class CommandQueue implements CommandQueueInterface {
  private pending = new Map<string, PendingCommand>();
  private queues = new Map<string, CommandEnvelope[]>();

  async enqueue(command: CommandEnvelope, session_token?: string): Promise<CommandResult> {
    if (this.pending.size >= TIMEOUTS.COMMAND_QUEUE_MAX) {
      throw new Error('Command queue full');
    }

    return new Promise<CommandResult>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(command.id);
        reject(new Error(`Command ${command.id} timed out after ${command.timeout_ms}ms`));
      }, command.timeout_ms);
      timer.unref();

      this.pending.set(command.id, { command, resolve, reject, timer });

      // Add to session queue for polling
      if (session_token) {
        let queue = this.queues.get(session_token);
        if (!queue) {
          queue = [];
          this.queues.set(session_token, queue);
        }
        queue.push(command);
      }

      logger.debug({ command_id: command.id, tool: command.tool }, 'Command enqueued');
    });
  }

  poll(token: string): CommandEnvelope | null {
    const queue = this.queues.get(token);
    if (!queue || queue.length === 0) return null;
    return queue.shift()!;
  }

  respond(command_id: string, result: CommandResult): void {
    const pending = this.pending.get(command_id);
    if (!pending) {
      logger.warn({ command_id }, 'Response for unknown command');
      return;
    }

    clearTimeout(pending.timer);
    this.pending.delete(command_id);
    pending.resolve(result);
    logger.debug({ command_id, success: result.success }, 'Command responded');
  }

  get pending_count(): number {
    return this.pending.size;
  }
}
