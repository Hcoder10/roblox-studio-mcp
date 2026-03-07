import { GoogleGenAI, type GenerateContentResponse } from '@google/genai';
import type {
  GenerativeModelClient,
  ToolDefinition,
  Message,
  AgentTurn,
  MessagePart,
} from '../agents/types.js';
import pino from 'pino';

const logger = pino({ name: 'gemini-client' });

export class GeminiClient implements GenerativeModelClient {
  private client: GoogleGenAI;

  constructor(
    private model: string,
    api_key: string,
    private temperature: number,
    private max_tokens: number,
  ) {
    this.client = new GoogleGenAI({ apiKey: api_key });
  }

  async generate(
    system_prompt: string,
    tools: ToolDefinition[],
    history: Message[],
  ): Promise<AgentTurn> {
    const gemini_tools = tools.length > 0
      ? [{
          functionDeclarations: tools.map(t => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          })),
        }]
      : undefined;

    const contents = history.map(msg => ({
      role: msg.role === 'tool' ? 'function' as const : msg.role,
      parts: msg.parts.map(part => this.convert_part_to_gemini(part)),
    }));

    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents,
        config: {
          systemInstruction: system_prompt,
          tools: gemini_tools,
          temperature: this.temperature,
          maxOutputTokens: this.max_tokens,
        },
      });

      return this.parse_response(response);
    } catch (error) {
      logger.error({ error, model: this.model }, 'Gemini API call failed');
      throw error;
    }
  }

  private convert_part_to_gemini(part: MessagePart): Record<string, unknown> {
    if ('text' in part && !('thought' in part)) {
      return { text: part.text };
    }
    if ('thought' in part) {
      return { thought: true, text: part.text };
    }
    if ('functionCall' in part) {
      return {
        functionCall: {
          name: part.functionCall.name,
          args: part.functionCall.args,
        },
      };
    }
    if ('functionResponse' in part) {
      return {
        functionResponse: {
          name: part.functionResponse.name,
          response: part.functionResponse.response,
        },
      };
    }
    return { text: '' };
  }

  private parse_response(response: GenerateContentResponse): AgentTurn {
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      return { text: 'No response from model', tool_calls: [], done: true };
    }

    const candidate = candidates[0];
    const parts: unknown[] = candidate.content?.parts ?? [];

    let thinking: string | undefined;
    let text: string | undefined;
    const tool_calls: AgentTurn['tool_calls'] = [];

    for (const part of parts) {
      const p = part as Record<string, unknown>;

      // Preserve thought_signature — keep full parts array intact
      if (p.thought === true && typeof p.text === 'string') {
        thinking = (thinking ?? '') + p.text;
        continue;
      }

      if (typeof p.text === 'string') {
        text = (text ?? '') + p.text;
        continue;
      }

      if (p.functionCall) {
        const fc = p.functionCall as { name: string; args: Record<string, unknown> };
        tool_calls.push({
          tool_name: fc.name,
          args: fc.args ?? {},
        });
      }
    }

    const done = tool_calls.length === 0;

    return { thinking, text, tool_calls, done };
  }
}
