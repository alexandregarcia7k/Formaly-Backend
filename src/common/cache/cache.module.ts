import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redis } from '../redis/redis.client';

// Custom store para Upstash Redis com fallback
const upstashStore = {
  async get(key: string) {
    try {
      const value = await redis.get(key);
      if (!value) return null;

      try {
        return JSON.parse(value);
      } catch {
        // Remover valor corrompido
        await redis.del(key).catch(() => {});
        return null;
      }
    } catch {
      return null;
    }
  },
  async set(key: string, value: unknown, ttl?: number) {
    try {
      const serialized = JSON.stringify(value);
      await redis.set(key, serialized, ttl ? { ex: ttl } : undefined);
    } catch {
      // Fail silently
    }
  },
  async del(key: string) {
    try {
      await redis.del(key);
    } catch {
      // Fail silently
    }
  },
  async reset() {},
  async mget(...keys: string[]) {
    try {
      // mget não está no adapter, usar get individual
      const values = await Promise.all(keys.map((k) => redis.get(k)));
      return values;
    } catch {
      return [];
    }
  },
  async mset(args: [string, unknown][]) {
    try {
      const pipeline = redis.pipeline();
      args.forEach(([key, value]) => {
        pipeline.set(key, JSON.stringify(value));
      });
      await pipeline.exec();
    } catch {
      // Fail silently
    }
  },
  async mdel(...keys: string[]) {
    try {
      const pipeline = redis.pipeline();
      keys.forEach((key) => {
        pipeline.del(key);
      });
      await pipeline.exec();
    } catch {
      // Fail silently
    }
  },
  keys(_pattern: string) {
    // keys não está no adapter, retornar vazio
    return [];
  },
  async ttl(key: string) {
    try {
      return redis.ttl(key);
    } catch {
      return -1;
    }
  },
};

@Global()
@Module({
  imports: [
    CacheModule.register({
      store: upstashStore as any,
    }),
  ],
  exports: [CacheModule],
})
export class AppCacheModule {}
