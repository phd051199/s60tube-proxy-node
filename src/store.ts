interface StoreEntry<T> {
  value: T;
  expiresAt: number;
}

class Store<T = unknown> {
  private store = new Map<string, StoreEntry<T>>();
  private readonly DEFAULT_TTL_MS = 86400 * 1000; // 24 hours

  set(key: string, value: T, ttlMs = this.DEFAULT_TTL_MS): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    const now = Date.now();

    if (!entry || entry.expiresAt < now) {
      if (entry) {
        this.store.delete(key);
      }
      return undefined;
    }

    return entry.value;
  }

  has(key: string): boolean {
    const entry = this.store.get(key);
    return !!entry && entry.expiresAt >= Date.now();
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}

export const kvStore = new Store<string>();
