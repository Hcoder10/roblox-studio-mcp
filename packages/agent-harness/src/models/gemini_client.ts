import {
  FunctionCallingConfigMode,
  GoogleGenAI,
  Modality,
  type GenerateContentResponse,
  type LiveCallbacks,
  type Session,
} from '@google/genai';
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
    private live_model: string,
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
            parameters: this.sanitize_tool_parameters(t.parameters),
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
          toolConfig: gemini_tools
            ? {
                functionCallingConfig: {
                  mode: FunctionCallingConfigMode.AUTO,
                },
              }
            : undefined,
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

  async create_live_session(
    system_prompt: string,
    tools: ToolDefinition[],
    callbacks?: LiveCallbacks,
  ): Promise<Session> {
    const gemini_tools = tools.length > 0
      ? [({
          functionDeclarations: tools.map(t => ({
            name: t.name,
            description: t.description,
            parameters: this.sanitize_tool_parameters(t.parameters),
          })),
        })]
      : undefined;

    const live_callbacks: LiveCallbacks = callbacks ?? {
      onmessage: () => {},
    };

    return this.client.live.connect({
      model: this.live_model,
      config: {
        responseModalities: [Modality.TEXT],
        systemInstruction: system_prompt,
        tools: gemini_tools,
        temperature: this.temperature,
        maxOutputTokens: this.max_tokens,
      },
      callbacks: live_callbacks,
    });
  }

  private sanitize_tool_parameters(parameters: Record<string, unknown>): Record<string, unknown> {
    const sanitized = this.sanitize_schema(parameters, parameters);
    if (!sanitized || typeof sanitized !== 'object' || Array.isArray(sanitized)) {
      return { type: 'object', properties: {} };
    }

    const schema = sanitized as Record<string, unknown>;
    if (!schema.type && !schema.anyOf && !schema.oneOf && !schema.allOf) {
      schema.type = 'object';
    }

    if (schema.type === 'object') {
      if (!schema.properties && schema.additionalProperties === undefined) {
        schema.additionalProperties = true;
      }
      if (schema.required && Array.isArray(schema.required)) {
        schema.required = schema.required.filter((item): item is string => typeof item === 'string');
      }
    }

    return schema;
  }

  private sanitize_schema(input: unknown, root: unknown): unknown {
    if (input == null) return undefined;
    if (Array.isArray(input)) {
      return input
        .map((item) => this.sanitize_schema(item, root))
        .filter((item): item is unknown => item !== undefined);
    }
    if (typeof input !== 'object') {
      return input;
    }

    const source = input as Record<string, unknown>;

    if (typeof source.$ref === 'string') {
      const resolved = this.resolve_local_ref(root, source.$ref);
      if (resolved !== undefined && resolved !== input) {
        return this.sanitize_schema(resolved, root);
      }
      return undefined;
    }

    const schema: Record<string, unknown> = {};

    if (typeof source.description === 'string') schema.description = source.description;
    if (typeof source.format === 'string') schema.format = source.format;
    if (typeof source.minimum === 'number') schema.minimum = source.minimum;
    if (typeof source.maximum === 'number') schema.maximum = source.maximum;
    if (typeof source.minLength === 'number') schema.minLength = source.minLength;
    if (typeof source.maxLength === 'number') schema.maxLength = source.maxLength;
    if (typeof source.minItems === 'number') schema.minItems = source.minItems;
    if (typeof source.maxItems === 'number') schema.maxItems = source.maxItems;
    if (typeof source.pattern === 'string') schema.pattern = source.pattern;

    if (Array.isArray(source.type)) {
      schema.anyOf = source.type
        .map((type_name) => (typeof type_name === 'string' ? { type: type_name } : undefined))
        .filter((item): item is { type: string } => item != null);
    } else if (typeof source.type === 'string') {
      schema.type = source.type;
    }

    if (Array.isArray(source.enum)) {
      schema.enum = source.enum;
    } else if (source.const !== undefined) {
      schema.enum = [source.const];
    }

    for (const combinator of ['anyOf', 'oneOf', 'allOf'] as const) {
      if (Array.isArray(source[combinator])) {
        const variants = (source[combinator] as unknown[])
          .map((variant) => this.sanitize_schema(variant, root))
          .filter((variant): variant is Record<string, unknown> => !!variant && typeof variant === 'object');
        if (variants.length > 0) {
          schema[combinator] = variants;
        }
      }
    }

    if (source.properties && typeof source.properties === 'object' && !Array.isArray(source.properties)) {
      const properties: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(source.properties as Record<string, unknown>)) {
        const sanitized = this.sanitize_schema(value, root);
        if (sanitized !== undefined) {
          properties[key] = sanitized;
        }
      }
      schema.properties = properties;
    }

    if (Array.isArray(source.required)) {
      schema.required = source.required.filter((item): item is string => typeof item === 'string');
    }

    if (source.additionalProperties !== undefined) {
      if (typeof source.additionalProperties === 'boolean') {
        schema.additionalProperties = source.additionalProperties;
      } else if (typeof source.additionalProperties === 'object' && source.additionalProperties !== null) {
        const sanitized = this.sanitize_schema(source.additionalProperties, root);
        if (sanitized !== undefined) {
          schema.additionalProperties = sanitized;
        }
      }
    }

    const tuple_items = Array.isArray(source.items) ? source.items : Array.isArray(source.prefixItems) ? source.prefixItems : undefined;
    if (tuple_items) {
      const sanitized_items = tuple_items
        .map((item) => this.sanitize_schema(item, root))
        .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object');

      if (sanitized_items.length === 1) {
        schema.items = sanitized_items[0];
      } else if (sanitized_items.length > 1) {
        schema.items = { anyOf: sanitized_items };
      }
    } else if (source.items !== undefined) {
      const sanitized_items = this.sanitize_schema(source.items, root);
      if (sanitized_items && typeof sanitized_items === 'object' && !Array.isArray(sanitized_items)) {
        schema.items = sanitized_items;
      } else if (typeof sanitized_items === 'boolean') {
        schema.items = sanitized_items;
      }
    }

    if (Array.isArray(schema.required)) {
      if (schema.properties && typeof schema.properties === 'object' && !Array.isArray(schema.properties)) {
        const defined_props = new Set(Object.keys(schema.properties as Record<string, unknown>));
        schema.required = schema.required.filter((item): item is string => typeof item === 'string' && defined_props.has(item));
      } else {
        delete schema.required;
      }

      if (Array.isArray(schema.required) && schema.required.length === 0) {
        delete schema.required;
      }
    }

    if (schema.type === 'array' && schema.items === undefined) {
      schema.items = {};
    }

    return Object.keys(schema).length > 0 ? schema : undefined;
  }

  private resolve_local_ref(root: unknown, ref: string): unknown {
    if (!ref.startsWith('#/')) {
      return undefined;
    }

    const decode = (segment: string): string => segment.replace(/~1/g, '/').replace(/~0/g, '~');
    const segments = ref.slice(2).split('/').map(decode);

    let current: unknown = root;
    for (const segment of segments) {
      if (!current || typeof current !== 'object' || Array.isArray(current)) {
        return undefined;
      }
      const record = current as Record<string, unknown>;
      if (!(segment in record)) {
        return undefined;
      }
      current = record[segment];
    }

    return current;
  }

  private convert_part_to_gemini(part: MessagePart): Record<string, unknown> {
    if ('raw' in part) {
      return part.raw;
    }
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
    const model_parts: MessagePart[] = [];

    for (const part of parts) {
      const p = part as Record<string, unknown>;
      model_parts.push({ raw: p });

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

    return { thinking, text, tool_calls, model_parts, done };
  }
}
