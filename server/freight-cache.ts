import { FreightCalculationResponse, FreightOption } from '@shared/schema';

interface FreightCacheEntry {
  result: FreightCalculationResponse;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface FreightCache {
  [key: string]: FreightCacheEntry;
}

/**
 * Service for caching freight calculations to improve performance
 * and reduce API calls to external shipping providers
 */
export class FreightCacheService {
  private cache: FreightCache = {};
  private readonly DEFAULT_TTL = 3600000; // 1 hour in milliseconds
  private readonly WEIGHT_GROUP_SIZE = 100; // Group weights by 100g intervals

  /**
   * Generate a cache key based on postal code and weight group
   * Groups weights to reduce cache fragmentation (e.g., 150g and 180g use same cache)
   */
  private getCacheKey(postalCode: string, weight: number): string {
    const formattedCEP = postalCode.replace(/\D/g, '');
    const weightGroup = Math.ceil(weight / this.WEIGHT_GROUP_SIZE) * this.WEIGHT_GROUP_SIZE;
    return `${formattedCEP}-${weightGroup}g`;
  }

  /**
   * Check if a cache entry is still valid
   */
  private isValidEntry(entry: FreightCacheEntry): boolean {
    return (Date.now() - entry.timestamp) < entry.ttl;
  }

  /**
   * Get cached freight calculation or return null if not found/expired
   */
  getCached(postalCode: string, weight: number): FreightCalculationResponse | null {
    const key = this.getCacheKey(postalCode, weight);
    const entry = this.cache[key];

    if (!entry) {
      return null;
    }

    if (!this.isValidEntry(entry)) {
      // Remove expired entry
      delete this.cache[key];
      return null;
    }

    console.log(`Cache HIT for ${key}`);
    return entry.result;
  }

  /**
   * Store freight calculation result in cache
   */
  setCached(
    postalCode: string, 
    weight: number, 
    result: FreightCalculationResponse,
    ttl: number = this.DEFAULT_TTL
  ): void {
    const key = this.getCacheKey(postalCode, weight);
    
    this.cache[key] = {
      result,
      timestamp: Date.now(),
      ttl
    };

    console.log(`Cache SET for ${key} (TTL: ${ttl}ms)`);
  }

  /**
   * Clear expired entries from cache
   */
  cleanupExpired(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of Object.entries(this.cache)) {
      if (!this.isValidEntry(entry)) {
        delete this.cache[key];
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`Cleaned up ${removedCount} expired cache entries`);
    }
  }

  /**
   * Clear all cache entries
   */
  clearAll(): void {
    this.cache = {};
    console.log('Freight cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): { totalEntries: number; validEntries: number; expiredEntries: number } {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const entry of Object.values(this.cache)) {
      if (this.isValidEntry(entry)) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalEntries: Object.keys(this.cache).length,
      validEntries,
      expiredEntries
    };
  }
}

// Singleton instance
export const freightCache = new FreightCacheService();

// Cleanup expired entries every 30 minutes
setInterval(() => {
  freightCache.cleanupExpired();
}, 30 * 60 * 1000);
