export { RobloxKnowledgeBase } from './knowledge_base.js';
export { VectorStore } from './vector_store.js';
export type { Chunk } from './vector_store.js';
export { chunk_api_dump } from './chunker.js';
export { get_roblox_patterns } from './roblox_patterns.js';

import { RobloxKnowledgeBase } from './knowledge_base.js';

let _instance: RobloxKnowledgeBase | null = null;

/**
 * Get or create the singleton knowledge base instance.
 * Call initialize() on the returned instance before using search().
 */
export function create_knowledge_base(): RobloxKnowledgeBase {
  if (!_instance) {
    _instance = new RobloxKnowledgeBase();
  }
  return _instance;
}
