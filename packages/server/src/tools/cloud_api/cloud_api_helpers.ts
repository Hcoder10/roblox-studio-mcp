import type { ToolResponse } from '@roblox-studio-mcp/shared';

const BASE_URL = 'https://apis.roblox.com';

export function get_api_key(): string | null {
  return process.env.ROBLOX_CLOUD_API_KEY || null;
}

export async function cloud_fetch(
  path: string,
  options: { method?: string; body?: unknown; query?: Record<string, string> } = {},
): Promise<ToolResponse> {
  const api_key = get_api_key();
  if (!api_key) {
    return {
      success: false,
      error: {
        code: 'CLOUD_API_AUTH_FAILED',
        message: 'ROBLOX_CLOUD_API_KEY environment variable is not set.',
        layer: 'cloud_api',
        retryable: false,
      },
    };
  }

  let url = `${BASE_URL}${path}`;
  if (options.query) {
    const params = new URLSearchParams(
      Object.entries(options.query).filter(([, v]) => v !== undefined && v !== ''),
    );
    if (params.toString()) url += `?${params.toString()}`;
  }

  try {
    const resp = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'x-api-key': api_key,
        'Content-Type': 'application/json',
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(15_000),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      return {
        success: false,
        error: {
          code: resp.status === 429 ? 'CLOUD_API_RATE_LIMITED'
            : resp.status === 404 ? 'CLOUD_API_NOT_FOUND'
            : resp.status === 401 || resp.status === 403 ? 'CLOUD_API_AUTH_FAILED'
            : 'CLOUD_API_REQUEST_FAILED',
          message: `Roblox API error ${resp.status}: ${text}`,
          layer: 'cloud_api',
          retryable: resp.status === 429 || resp.status >= 500,
        },
      };
    }

    const data = resp.status === 204 ? null : await resp.json();
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'CLOUD_API_REQUEST_FAILED',
        message: err instanceof Error ? err.message : 'Cloud API request failed',
        layer: 'cloud_api',
        retryable: true,
      },
    };
  }
}
