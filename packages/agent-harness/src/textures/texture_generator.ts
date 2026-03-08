import { GoogleGenAI } from '@google/genai';
import pino from 'pino';

const logger = pino({ name: 'texture-generator' });

export interface TextureResult {
  image_base64: string;
  mime_type: string;
}

export interface TextureFallback {
  description: string;
  material: string;
  color: { r: number; g: number; b: number };
  transparency: number;
  reflectance: number;
}

/**
 * Generates textures for Roblox using Gemini image generation.
 * Falls back to material descriptions when image generation is unavailable.
 */
export class TextureGenerator {
  private client: GoogleGenAI;
  private model: string;

  constructor(api_key?: string, model?: string) {
    const key = api_key ?? process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is required for TextureGenerator');
    }
    this.client = new GoogleGenAI({ apiKey: key });
    this.model = model ?? 'gemini-2.0-flash-exp';
  }

  /**
   * Generate a texture image for use in Roblox.
   * Falls back to a text description if image generation is not available.
   */
  async generate_texture(
    description: string,
    size: { width: number; height: number },
  ): Promise<TextureResult | TextureFallback> {
    try {
      return await this.try_image_generation(
        `Generate a ${size.width}x${size.height} texture for a Roblox game: ${description}. ` +
        `The texture should be clean, game-ready, and suitable for application on 3D surfaces. ` +
        `Style: stylized game art, not photorealistic.`,
      );
    } catch (error) {
      logger.warn({ error, description }, 'Image generation failed, returning material fallback');
      return this.generate_material_fallback(description);
    }
  }

  /**
   * Generate a Roblox game thumbnail image.
   */
  async generate_thumbnail(
    game_description: string,
  ): Promise<TextureResult | TextureFallback> {
    try {
      return await this.try_image_generation(
        `Generate a 512x512 game thumbnail for a Roblox game: ${game_description}. ` +
        `Style: eye-catching, colorful, appealing to young gamers. ` +
        `Include the game's main theme visually. No text.`,
      );
    } catch (error) {
      logger.warn({ error, game_description }, 'Thumbnail generation failed, returning fallback');
      return {
        description: `Thumbnail for: ${game_description}`,
        material: 'SmoothPlastic',
        color: { r: 0.3, g: 0.5, b: 0.8 },
        transparency: 0,
        reflectance: 0.2,
      };
    }
  }

  /**
   * Generate a seamless, tileable texture for repeating surfaces.
   */
  async generate_tileable_texture(
    description: string,
  ): Promise<TextureResult | TextureFallback> {
    try {
      return await this.try_image_generation(
        `Generate a seamless, tileable 512x512 texture: ${description}. ` +
        `The texture must tile perfectly with no visible seams when repeated. ` +
        `Style: game-ready, suitable for Roblox surfaces.`,
      );
    } catch (error) {
      logger.warn({ error, description }, 'Tileable texture generation failed, returning fallback');
      return this.generate_material_fallback(description);
    }
  }

  private async try_image_generation(prompt: string): Promise<TextureResult> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      config: {
        responseModalities: ['image', 'text'],
        temperature: 0.8,
      },
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];

    for (const part of parts) {
      const p = part as Record<string, unknown>;
      if (p.inlineData) {
        const inline = p.inlineData as { mimeType: string; data: string };
        return {
          image_base64: inline.data,
          mime_type: inline.mimeType,
        };
      }
    }

    throw new Error('No image data in response');
  }

  private async generate_material_fallback(description: string): Promise<TextureFallback> {
    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Given this texture description for a Roblox game: "${description}"

Suggest the best Roblox built-in material and color to approximate this look.

Available materials: Plastic, SmoothPlastic, Wood, WoodPlanks, Brick, Concrete, Metal, CorrodedMetal, DiamondPlate, Granite, Marble, Slate, Limestone, Sandstone, Basalt, Glass, Neon, Grass, LeafyGrass, Sand, Ice, Snow, Glacier, Fabric, Foil, ForceField, CrackedLava, Cobblestone, Ground, Rock, Asphalt

Respond in this exact JSON format only:
{
  "material": "MaterialName",
  "color": {"r": 0.5, "g": 0.5, "b": 0.5},
  "transparency": 0,
  "reflectance": 0,
  "description": "Brief visual description"
}`,
              },
            ],
          },
        ],
        config: {
          temperature: 0.3,
          maxOutputTokens: 256,
        },
      });

      const text = response.candidates?.[0]?.content?.parts?.[0];
      const raw_text = text && 'text' in text ? (text as { text: string }).text : '';
      const cleaned = raw_text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const parsed = JSON.parse(cleaned);

      return {
        description: parsed.description ?? description,
        material: parsed.material ?? 'SmoothPlastic',
        color: parsed.color ?? { r: 0.5, g: 0.5, b: 0.5 },
        transparency: parsed.transparency ?? 0,
        reflectance: parsed.reflectance ?? 0,
      };
    } catch {
      // Final fallback with sensible defaults
      return {
        description,
        material: 'SmoothPlastic',
        color: { r: 0.5, g: 0.5, b: 0.5 },
        transparency: 0,
        reflectance: 0,
      };
    }
  }
}
