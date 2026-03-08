import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import pino from 'pino';
import { VectorStore } from './vector_store.js';
import type { Chunk } from './vector_store.js';
import { chunk_api_dump, type ApiDump } from './chunker.js';
import { get_roblox_patterns } from './roblox_patterns.js';

const logger = pino({ name: 'knowledge-base' });

const API_DUMP_URL = 'https://raw.githubusercontent.com/MaximumADHD/Roblox-Client-Tracker/roblox/Full-API-Dump.json';
const CACHE_DIR = join(process.cwd(), '.cache', 'rag');
const API_DUMP_CACHE = join(CACHE_DIR, 'api-dump.json');
const CHUNKS_CACHE = join(CACHE_DIR, 'chunks.json');
// Re-download if cache is older than 24 hours
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export class RobloxKnowledgeBase {
  private store = new VectorStore();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const start = Date.now();
    logger.info('Initializing Roblox knowledge base...');

    // Try loading pre-processed chunks from cache
    const cached_chunks = await this.load_cached_chunks();
    if (cached_chunks) {
      this.store.add_many(cached_chunks);
      this.initialized = true;
      logger.info({ duration_ms: Date.now() - start, chunks: this.store.size }, 'Loaded from cache');
      return;
    }

    // Download and process API dump
    const api_dump = await this.get_api_dump();
    const api_chunks = chunk_api_dump(api_dump);

    // Add hardcoded pattern chunks
    const pattern_chunks = get_roblox_patterns();

    const all_chunks = [...api_chunks, ...pattern_chunks];

    // Index all chunks
    this.store.add_many(all_chunks);

    // Cache processed chunks for fast startup next time
    await this.save_cached_chunks(all_chunks);

    this.initialized = true;
    logger.info({
      duration_ms: Date.now() - start,
      api_chunks: api_chunks.length,
      pattern_chunks: pattern_chunks.length,
      total: this.store.size,
    }, 'Knowledge base initialized');
  }

  /**
   * Search for relevant knowledge chunks given a query.
   */
  search(query: string, limit = 5): Array<{ chunk: Chunk; score: number }> {
    if (!this.initialized) {
      logger.warn('Knowledge base not initialized, returning empty results');
      return [];
    }
    return this.store.search(query, limit);
  }

  get chunk_count(): number {
    return this.store.size;
  }

  private async get_api_dump(): Promise<ApiDump> {
    // Check cache
    if (existsSync(API_DUMP_CACHE)) {
      try {
        const stat = await import('node:fs').then(fs =>
          fs.promises.stat(API_DUMP_CACHE)
        );
        if (Date.now() - stat.mtimeMs < CACHE_MAX_AGE_MS) {
          logger.info('Using cached API dump');
          const raw = await readFile(API_DUMP_CACHE, 'utf-8');
          return JSON.parse(raw);
        }
      } catch {
        // Cache read failed, re-download
      }
    }

    // Download fresh
    logger.info('Downloading Roblox API dump...');
    const response = await fetch(API_DUMP_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch API dump: ${response.status} ${response.statusText}`);
    }
    const text = await response.text();

    // Cache the raw dump
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(API_DUMP_CACHE, text, 'utf-8');
    logger.info('API dump cached');

    return JSON.parse(text);
  }

  private async load_cached_chunks(): Promise<Chunk[] | null> {
    if (!existsSync(CHUNKS_CACHE)) return null;

    try {
      const stat = await import('node:fs').then(fs =>
        fs.promises.stat(CHUNKS_CACHE)
      );
      if (Date.now() - stat.mtimeMs > CACHE_MAX_AGE_MS) {
        return null; // Cache too old
      }
      const raw = await readFile(CHUNKS_CACHE, 'utf-8');
      return JSON.parse(raw) as Chunk[];
    } catch {
      return null;
    }
  }

  private async save_cached_chunks(chunks: Chunk[]): Promise<void> {
    try {
      await mkdir(CACHE_DIR, { recursive: true });
      await writeFile(CHUNKS_CACHE, JSON.stringify(chunks), 'utf-8');
      logger.info({ path: CHUNKS_CACHE }, 'Chunks cache saved');
    } catch (err) {
      logger.warn({ err }, 'Failed to save chunks cache');
    }
  }
}
