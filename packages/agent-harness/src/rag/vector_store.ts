import pino from 'pino';

const logger = pino({ name: 'vector-store' });

export interface Chunk {
  id: string;
  title: string;
  content: string;
  category: 'class' | 'service' | 'enum' | 'pattern';
  tags: string[];
}

interface IndexedChunk {
  chunk: Chunk;
  term_freqs: Map<string, number>;
  doc_length: number;
}

// Roblox-specific stop words that appear everywhere and aren't useful for search
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for',
  'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over',
  'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when',
  'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
  'same', 'so', 'than', 'too', 'very', 'just', 'because', 'but', 'and',
  'or', 'if', 'while', 'that', 'this', 'it', 'its', 'also', 'which',
  'their', 'them', 'they', 'he', 'she', 'we', 'you', 'i', 'me', 'my',
  'your', 'his', 'her', 'our',
]);

/**
 * Tokenize text into searchable terms.
 * Handles camelCase/PascalCase splitting and Roblox-specific terms.
 */
function tokenize(text: string): string[] {
  // Split camelCase/PascalCase into separate tokens while keeping original
  const camel_split = text.replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');

  const raw_tokens = camel_split
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);

  return raw_tokens.filter(t => !STOP_WORDS.has(t));
}

/**
 * BM25-based in-memory vector store for Roblox knowledge chunks.
 * No external dependencies - pure TypeScript implementation.
 */
export class VectorStore {
  private documents: IndexedChunk[] = [];
  private doc_freq: Map<string, number> = new Map();
  private avg_doc_length = 0;
  // BUG FIX: Track total_doc_length incrementally to avoid O(n) recomputation
  // on every add() call (was causing O(n^2) in add_many)
  private total_doc_length = 0;

  // BM25 parameters
  private readonly k1 = 1.5;
  private readonly b = 0.75;

  add(chunk: Chunk): void {
    const text = `${chunk.title} ${chunk.tags.join(' ')} ${chunk.content}`;
    const tokens = tokenize(text);

    const term_freqs = new Map<string, number>();
    for (const token of tokens) {
      term_freqs.set(token, (term_freqs.get(token) ?? 0) + 1);
    }

    this.documents.push({
      chunk,
      term_freqs,
      doc_length: tokens.length,
    });

    // Update document frequency
    for (const term of term_freqs.keys()) {
      this.doc_freq.set(term, (this.doc_freq.get(term) ?? 0) + 1);
    }

    // Incrementally update average doc length
    this.total_doc_length += tokens.length;
    this.avg_doc_length = this.total_doc_length / this.documents.length;
  }

  add_many(chunks: Chunk[]): void {
    for (const chunk of chunks) {
      this.add(chunk);
    }
    logger.info({ count: chunks.length, total: this.documents.length }, 'Indexed chunks');
  }

  /**
   * Search using BM25 scoring algorithm.
   * Returns chunks sorted by relevance score.
   */
  search(query: string, limit = 5): Array<{ chunk: Chunk; score: number }> {
    const query_tokens = tokenize(query);
    if (query_tokens.length === 0) return [];

    const n = this.documents.length;
    const results: Array<{ chunk: Chunk; score: number }> = [];

    for (const doc of this.documents) {
      let score = 0;

      for (const term of query_tokens) {
        const tf = doc.term_freqs.get(term) ?? 0;
        if (tf === 0) continue;

        const df = this.doc_freq.get(term) ?? 0;
        // IDF with smoothing
        const idf = Math.log((n - df + 0.5) / (df + 0.5) + 1);

        // BM25 term frequency normalization
        const tf_norm = (tf * (this.k1 + 1))
          / (tf + this.k1 * (1 - this.b + this.b * (doc.doc_length / this.avg_doc_length)));

        score += idf * tf_norm;
      }

      // Boost for category match: if query mentions a category keyword, boost those docs
      if (query_tokens.some(t => ['pattern', 'how', 'example', 'code', 'tutorial', 'guide'].includes(t))) {
        if (doc.chunk.category === 'pattern') score *= 1.3;
      }

      // Boost for title match
      const title_tokens = new Set(tokenize(doc.chunk.title));
      const title_match_count = query_tokens.filter(t => title_tokens.has(t)).length;
      if (title_match_count > 0) {
        score *= 1 + (title_match_count / query_tokens.length) * 0.5;
      }

      // Boost for tag match
      const tag_tokens = new Set(doc.chunk.tags.map(t => t.toLowerCase()));
      const tag_match_count = query_tokens.filter(t => tag_tokens.has(t)).length;
      if (tag_match_count > 0) {
        score *= 1 + (tag_match_count / query_tokens.length) * 0.3;
      }

      if (score > 0) {
        results.push({ chunk: doc.chunk, score });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  get size(): number {
    return this.documents.length;
  }

  clear(): void {
    this.documents = [];
    this.doc_freq.clear();
    this.avg_doc_length = 0;
    this.total_doc_length = 0;
  }
}
