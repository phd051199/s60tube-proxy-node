import Redis from "ioredis";

class Store<T = unknown> {
  private redis: Redis;
  private readonly DEFAULT_TTL_MS = 86400 * 1000; // 24 hours

  constructor() {
    this.redis = new Redis({
      path: "/home/bmrknhtf/redis.sock",
      password: "ar0Dt3x7Iq",
    });
  }

  async set(key: string, value: T, ttlMs = this.DEFAULT_TTL_MS): Promise<void> {
    const serialized = JSON.stringify(value);
    await this.redis.set(key, serialized, "PX", ttlMs);
  }

  async get(key: string): Promise<T | undefined> {
    const serialized = await this.redis.get(key);

    if (!serialized) {
      return undefined;
    }

    try {
      return JSON.parse(serialized) as T;
    } catch (error) {
      console.error(`Failed to parse Redis value for key: ${key}`, error);
      return undefined;
    }
  }

  async has(key: string): Promise<boolean> {
    const exists = await this.redis.exists(key);
    return exists === 1;
  }

  async delete(key: string): Promise<boolean> {
    const result = await this.redis.del(key);
    return result === 1;
  }

  async clear(): Promise<void> {
    await this.redis.flushdb();
  }

  async size(): Promise<number> {
    return await this.redis.dbsize();
  }

  async disconnect(): Promise<void> {
    await this.redis.quit();
  }
}

export const kvStore = new Store<string>();
