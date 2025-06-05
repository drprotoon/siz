interface UserCacheEntry {
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
  timestamp: number;
  ttl: number;
}

interface UserCache {
  [userId: string]: UserCacheEntry;
}

/**
 * Service for caching user data to reduce database queries
 */
export class UserCacheService {
  private cache: UserCache = {};
  private readonly DEFAULT_TTL = 300000; // 5 minutes in milliseconds
  private readonly MAX_CACHE_SIZE = 500; // Maximum number of cached users

  /**
   * Check if a cache entry is still valid
   */
  private isValidEntry(entry: UserCacheEntry): boolean {
    return (Date.now() - entry.timestamp) < entry.ttl;
  }

  /**
   * Get cached user data or return null if not found/expired
   */
  getCached(userId: number): UserCacheEntry['user'] | null {
    const key = userId.toString();
    const entry = this.cache[key];

    if (!entry) {
      return null;
    }

    if (!this.isValidEntry(entry)) {
      // Remove expired entry
      delete this.cache[key];
      return null;
    }

    console.log(`User cache HIT for user ${userId}`);
    return entry.user;
  }

  /**
   * Store user data in cache
   */
  setCached(
    userId: number,
    user: UserCacheEntry['user'],
    ttl: number = this.DEFAULT_TTL
  ): void {
    const key = userId.toString();
    
    // Check if cache is full and clean up if necessary
    if (Object.keys(this.cache).length >= this.MAX_CACHE_SIZE) {
      this.cleanupExpired();
      
      // If still full after cleanup, remove oldest entries
      if (Object.keys(this.cache).length >= this.MAX_CACHE_SIZE) {
        this.removeOldestEntries(Math.floor(this.MAX_CACHE_SIZE * 0.1)); // Remove 10%
      }
    }
    
    this.cache[key] = {
      user,
      timestamp: Date.now(),
      ttl
    };

    console.log(`User cache SET for user ${userId} (TTL: ${ttl}ms)`);
  }

  /**
   * Remove oldest entries from cache
   */
  private removeOldestEntries(count: number): void {
    const entries = Object.entries(this.cache)
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)
      .slice(0, count);
    
    entries.forEach(([key]) => {
      delete this.cache[key];
    });
    
    console.log(`Removed ${entries.length} oldest user cache entries`);
  }

  /**
   * Clear expired entries from cache
   */
  cleanupExpired(): void {
    let removedCount = 0;

    for (const [key, entry] of Object.entries(this.cache)) {
      if (!this.isValidEntry(entry)) {
        delete this.cache[key];
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`Cleaned up ${removedCount} expired user cache entries`);
    }
  }

  /**
   * Remove specific user from cache (e.g., when user data is updated)
   */
  invalidateUser(userId: number): void {
    const key = userId.toString();
    if (this.cache[key]) {
      delete this.cache[key];
      console.log(`Invalidated cache for user ${userId}`);
    }
  }

  /**
   * Clear all cache entries
   */
  clearAll(): void {
    this.cache = {};
    console.log('User cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): { totalEntries: number; validEntries: number; expiredEntries: number } {
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
export const userCache = new UserCacheService();

// Cleanup expired entries every 10 minutes
setInterval(() => {
  userCache.cleanupExpired();
}, 10 * 60 * 1000);
