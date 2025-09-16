// lru-cache.js
export class LRUCache {
    constructor(limit = 50) {
        this.limit = limit;
        this.map = new Map();
    }

    get(key) {
        if (!this.map.has(key)) return null;
        const value = this.map.get(key);
        this.map.delete(key);
        this.map.set(key, value);
        return value;
    }

    set(key, value) {
        if (this.map.has(key)) this.map.delete(key);
        else if (this.map.size >= this.limit) {
            const firstKey = this.map.keys().next().value;
            this.map.delete(firstKey);
        }
        this.map.set(key, value);
    }
}

export const adAccountCache = new LRUCache(100); // Cache last 100 ad account validations
export const tokenCache = new LRUCache(10);      // Cache last 10 token validations
