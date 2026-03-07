import type { Request, Response, NextFunction } from 'express';
import type { StructuredError } from '@roblox-studio-mcp/shared';
import { logger } from '../util/logger.js';

export function error_handler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const structured: StructuredError = err instanceof StructuredErrorInstance
    ? err.toJSON()
    : {
        code: 'SERVER_INTERNAL',
        message: err instanceof Error ? err.message : 'Unknown error',
        layer: 'server',
        retryable: false,
      };

  logger.error({ err: structured }, 'Request error');
  const status = err instanceof StructuredErrorInstance ? err.status : 500;
  res.status(status).json({ success: false, error: structured });
}

export class StructuredErrorInstance extends Error {
  public status: number;
  constructor(
    public code: string,
    message: string,
    public layer: StructuredError['layer'],
    public retryable: boolean,
    status = 500,
    public tool?: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.status = status;
  }

  toJSON(): StructuredError {
    return {
      code: this.code,
      message: this.message,
      layer: this.layer,
      retryable: this.retryable,
      tool: this.tool,
      details: this.details,
    };
  }
}
