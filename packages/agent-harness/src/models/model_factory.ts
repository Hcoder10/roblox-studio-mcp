import type { ModelConfig } from '@roblox-studio-mcp/shared';
import type { GenerativeModelClient } from '../agents/types.js';
import { GeminiClient } from './gemini_client.js';

const DEFAULT_GEMINI_LIVE_MODEL = 'gemini-2.5-flash-native-audio-latest';

export class ModelFactory {
  private clients = new Map<string, GenerativeModelClient>();

  create_client(config: ModelConfig): GenerativeModelClient {
    const live_model = process.env.GEMINI_LIVE_MODEL ?? DEFAULT_GEMINI_LIVE_MODEL;
    const cache_key = `${config.provider}:${config.model}:${config.temperature}:${config.max_tokens}:${live_model}`;
    const cached = this.clients.get(cache_key);
    if (cached) return cached;

    let client: GenerativeModelClient;

    switch (config.provider) {
      case 'gemini': {
        const api_key = process.env[config.api_key_env];
        if (!api_key) {
          throw new Error(`Missing API key env var: ${config.api_key_env}`);
        }
        client = new GeminiClient(
          config.model,
          api_key,
          config.temperature,
          config.max_tokens,
          live_model,
        );
        break;
      }
      case 'openai':
      case 'anthropic':
        throw new Error(`Provider ${config.provider} is not yet implemented`);
      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }

    this.clients.set(cache_key, client);
    return client;
  }
}
