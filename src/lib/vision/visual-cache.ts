import type { VisualScene } from "./types";

interface CacheEntry {
  scene: VisualScene;
  timestamp: number;
}

export class VisualCache {
  private static instance: VisualCache;
  private cache = new Map<string, CacheEntry>();
  private readonly maxEntries = 100;
  private readonly ttlMs = 1000 * 60 * 60 * 24; // 24 hours

  public static getInstance(): VisualCache {
    if (!VisualCache.instance) {
      VisualCache.instance = new VisualCache();
    }
    return VisualCache.instance;
  }

  public get(imageHash: string): VisualScene | null {
    if (!imageHash) return null;
    const entry = this.cache.get(imageHash);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(imageHash);
      return null;
    }

    // Move to end (MRU)
    this.cache.delete(imageHash);
    this.cache.set(imageHash, entry);
    return entry.scene;
  }

  public set(imageHash: string, scene: VisualScene): void {
    if (!imageHash) return;

    if (this.cache.size >= this.maxEntries) {
      // Evict least recently used (first item in map)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(imageHash, {
      scene,
      timestamp: Date.now(),
    });
  }

  public clear(): void {
    this.cache.clear();
  }

  public size(): number {
    return this.cache.size;
  }
}
