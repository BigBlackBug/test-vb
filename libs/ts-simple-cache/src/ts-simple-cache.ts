export interface SimpleCache {
  delete(key: string): void;
  get(key: string): unknown | undefined;
  set(key: string, value: unknown): void;
}

/**
 *  Values bundled with their expiration time.
 */
type ExpiringCacheEntry = {
  expiration: number;
  value: unknown;
};

/**
 * Simple cache that deletes expired entries on retrieval.
 */
export class SimpleExpiringCache implements SimpleCache {
  private cache: Record<string, ExpiringCacheEntry> = {};
  expirationInMilliseconds = 0;

  constructor(expirationInMilliseconds: number) {
    if (expirationInMilliseconds <= 0) {
      console.warn(
        "SimpleExpiringCache can have expiration <= zero, but it won't be caching anything",
      );
    }
    this.expirationInMilliseconds = expirationInMilliseconds;
  }

  delete(key: string): void {
    delete this.cache[key];
  }

  get(key: string): unknown | undefined {
    if (key in this.cache) {
      const entry = this.cache[key];
      if (entry.expiration > Date.now()) {
        return entry.value;
      } else {
        this.delete(key);
      }
    }
    return undefined;
  }

  set(key: string, value: unknown): void {
    const expiration = this.expirationInMilliseconds + Date.now();
    this.cache[key] = {
      expiration: expiration,
      value: value,
    };
  }
}
