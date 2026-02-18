/**
 * Enhanced Cache Service
 * Features:
 * - Automatic cleanup of expired entries (memory leak prevention)
 * - TTL support
 * - Statistics monitoring
 * - Graceful shutdown
 */
class CacheService {
    constructor(ttlSeconds = 60) {
        this.cache = new Map();
        this.ttl = ttlSeconds * 1000;
        this.checkPeriod = 600000; // 10 mins

        // NEW: Auto-cleanup expired entries
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, this.checkPeriod);
    }

    cleanup() {
        const now = Date.now();
        let removed = 0;
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiry) {
                this.cache.delete(key);
                removed++;
            }
        }
        if (removed > 0) {
            console.log(`🧹 Cache cleanup: removed ${removed} expired entries`);
        }
    }

    // NEW: Clear all cache (useful for testing/debugging)
    clear() {
        this.cache.clear();
        console.log('🗑️ Cache cleared');
    }

    // NEW: Get cache stats (monitoring)
    getStats() {
        return {
            size: this.cache.size,
            ttl: this.ttl / 1000,
            entries: Array.from(this.cache.keys())
        };
    }

    // Existing methods...
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        return item.value;
    }

    set(key, value, customTTL = null) {
        const expiry = Date.now() + (customTTL ? customTTL * 1000 : this.ttl);
        this.cache.set(key, { value, expiry });
    }

    async getOrFetch(key, fetchFunction, customTTL = null) {
        const cached = this.get(key);
        if (cached) {
            console.log(`✅ Cache HIT: ${key}`);
            return cached;
        }

        console.log(`❌ Cache MISS: ${key} - fetching...`);
        const data = await fetchFunction();
        this.set(key, data, customTTL);
        return data;
    }

    // NEW: Shutdown cleanup (prevents memory leaks in tests)
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.clear();
    }
}

export const apiCache = new CacheService(300); // 5 min default

// NEW: Add different caches for different data types
export const priceCache = new CacheService(15);  // 15s for live prices
export const historicalCache = new CacheService(3600); // 1h for historical data
export const correlationCache = new CacheService(1800); // 30min for correlations
