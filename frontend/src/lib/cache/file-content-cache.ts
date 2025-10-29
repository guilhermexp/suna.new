/**
 * File content cache entry with metadata
 */
interface CacheEntry {
  content: string | Blob;
  contentType: string;
  timestamp: number;
}

/**
 * FileContentCache manages caching of file content with TTL and LRU eviction
 *
 * Features:
 * - 5-minute TTL (Time To Live) for cached entries
 * - LRU (Least Recently Used) eviction with max 50 entries
 * - Stores content with metadata (content type, timestamp)
 * - Singleton pattern for global cache instance
 */
export class FileContentCache {
  private cache: Map<string, CacheEntry>;
  private readonly maxEntries: number;
  private readonly ttlMs: number;

  constructor(maxEntries = 50, ttlMinutes = 5) {
    this.cache = new Map();
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMinutes * 60 * 1000; // Convert minutes to milliseconds
  }

  /**
   * Store content in cache with entry_id as key
   */
  set(entryId: string, content: string | Blob, contentType: string): void {
    // Evict oldest entry if cache is at max capacity
    if (this.cache.size >= this.maxEntries && !this.cache.has(entryId)) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    // Store new entry with current timestamp
    this.cache.set(entryId, {
      content,
      contentType,
      timestamp: Date.now(),
    });
  }

  /**
   * Retrieve content from cache
   * Returns null if entry doesn't exist or has expired
   */
  get(entryId: string): { content: string | Blob; contentType: string } | null {
    const entry = this.cache.get(entryId);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    const isExpired = Date.now() - entry.timestamp > this.ttlMs;

    if (isExpired) {
      this.cache.delete(entryId);
      return null;
    }

    // Move entry to end (most recently used) for LRU
    this.cache.delete(entryId);
    this.cache.set(entryId, entry);

    return {
      content: entry.content,
      contentType: entry.contentType,
    };
  }

  /**
   * Check if entry exists in cache (and is not expired)
   */
  has(entryId: string): boolean {
    return this.get(entryId) !== null;
  }

  /**
   * Clear specific entry from cache
   */
  delete(entryId: string): boolean {
    return this.cache.delete(entryId);
  }

  /**
   * Clear all entries from cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get current cache size
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get all valid (non-expired) entry IDs
   */
  getValidKeys(): string[] {
    const validKeys: string[] = [];
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp <= this.ttlMs) {
        validKeys.push(key);
      } else {
        // Clean up expired entries while iterating
        this.cache.delete(key);
      }
    }

    return validKeys;
  }
}

/**
 * Singleton instance of FileContentCache
 */
export const fileContentCache = new FileContentCache();
