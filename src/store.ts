class Store<T = unknown> {
  private store = new Map<string, { value: T; expiresAt: number }>();
  private readonly DEFAULT_TTL_MS = 86400 * 1000; // 24 hours

  constructor() {}

  set(key: string, value: T, ttlMs = this.DEFAULT_TTL_MS) {
    const expiresAt = Date.now() + ttlMs;
    this.store.set(key, { value, expiresAt });
  }

  get(key: string) {
    const entry = this.store.get(key);

    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  has(key: string) {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  delete(key: string) {
    return this.store.delete(key);
  }
}

export const kvStore = new Store<string>();
