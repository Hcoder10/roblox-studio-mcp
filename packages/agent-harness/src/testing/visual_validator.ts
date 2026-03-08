import { GoogleGenAI } from '@google/genai';
import pino from 'pino';

const logger = pino({ name: 'visual-validator' });

export interface ValidationResult {
  pass: boolean;
  issues: string[];
  suggestions: string[];
}

export interface ComparisonResult {
  changes_detected: string[];
  matches_expected: boolean;
}

/**
 * Uses Gemini vision to analyze screenshots from Roblox Studio
 * and validate visual correctness.
 */
export class VisualValidator {
  private client: GoogleGenAI;
  private model: string;

  constructor(api_key?: string, model?: string) {
    const key = api_key ?? process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is required for VisualValidator');
    }
    this.client = new GoogleGenAI({ apiKey: key });
    this.model = model ?? 'gemini-2.5-pro';
  }

  /**
   * Analyze a screenshot against an expected description using Gemini vision.
   */
  async validate_screenshot(
    screenshot_base64: string,
    expected_description: string,
  ): Promise<ValidationResult> {
    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: 'image/png',
                  data: screenshot_base64,
                },
              },
              {
                text: `You are a Roblox game visual QA expert. Analyze this screenshot from Roblox Studio.

Expected: ${expected_description}

Evaluate whether the screenshot matches the expected description. Look for:
1. Structural correctness (parts in right positions, correct shapes)
2. Material and color accuracy
3. Lighting and visual quality
4. Any visual glitches (z-fighting, clipping, missing textures)
5. Completeness (all expected elements present)

Respond in this exact JSON format:
{
  "pass": true/false,
  "issues": ["issue 1", "issue 2"],
  "suggestions": ["suggestion 1", "suggestion 2"]
}

If everything looks correct, set pass to true with empty issues array.
Respond ONLY with the JSON, no other text.`,
              },
            ],
          },
        ],
        config: {
          temperature: 0.1,
          maxOutputTokens: 1024,
        },
      });

      const text = response.candidates?.[0]?.content?.parts?.[0];
      const raw_text = text && 'text' in text ? (text as { text: string }).text : '';

      return this.parse_validation_result(raw_text);
    } catch (error) {
      logger.error({ error }, 'Screenshot validation failed');
      return {
        pass: false,
        issues: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        suggestions: ['Retry the validation or check the screenshot format'],
      };
    }
  }

  /**
   * Compare before/after screenshots and check if changes match expectations.
   */
  async compare_screenshots(
    before: string,
    after: string,
    expected_changes: string,
  ): Promise<ComparisonResult> {
    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: 'BEFORE screenshot:',
              },
              {
                inlineData: {
                  mimeType: 'image/png',
                  data: before,
                },
              },
              {
                text: 'AFTER screenshot:',
              },
              {
                inlineData: {
                  mimeType: 'image/png',
                  data: after,
                },
              },
              {
                text: `You are a Roblox game visual QA expert. Compare these before/after screenshots.

Expected changes: ${expected_changes}

Identify all visible differences between the two screenshots.
Then determine if the changes match what was expected.

Respond in this exact JSON format:
{
  "changes_detected": ["change 1", "change 2"],
  "matches_expected": true/false
}

Respond ONLY with the JSON, no other text.`,
              },
            ],
          },
        ],
        config: {
          temperature: 0.1,
          maxOutputTokens: 1024,
        },
      });

      const text = response.candidates?.[0]?.content?.parts?.[0];
      const raw_text = text && 'text' in text ? (text as { text: string }).text : '';

      return this.parse_comparison_result(raw_text);
    } catch (error) {
      logger.error({ error }, 'Screenshot comparison failed');
      return {
        changes_detected: [`Comparison error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        matches_expected: false,
      };
    }
  }

  private parse_validation_result(raw: string): ValidationResult {
    try {
      // Strip markdown code fences if present
      const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return {
        pass: Boolean(parsed.pass),
        issues: Array.isArray(parsed.issues) ? parsed.issues : [],
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      };
    } catch {
      logger.warn({ raw }, 'Failed to parse validation result as JSON');
      return {
        pass: false,
        issues: ['Failed to parse model response'],
        suggestions: [raw],
      };
    }
  }

  private parse_comparison_result(raw: string): ComparisonResult {
    try {
      const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return {
        changes_detected: Array.isArray(parsed.changes_detected) ? parsed.changes_detected : [],
        matches_expected: Boolean(parsed.matches_expected),
      };
    } catch {
      logger.warn({ raw }, 'Failed to parse comparison result as JSON');
      return {
        changes_detected: ['Failed to parse model response'],
        matches_expected: false,
      };
    }
  }
}
