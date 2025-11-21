import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { upstashRedis } from '../redis/redis.client';

// Custom store para Upstash Redis com fallback
const upstashStore = {
  async get(key: string) {
    try {
      const value = await upstashRedis.get(key);
      if (!value) return null;

      try {
        return JSON.parse(value as string);
      } catch {
        // Remover valor corrompido
        await upstashRedis.del(key).catch(() => {});
        return null;
      }
    } catch {
      return null;
    }
  },
  async set(key: string, value: unknown, ttl?: number) {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await upstashRedis.setex(key, ttl, serialized);
      } else {
        await upstashRedis.set(key, serialized);
      }
    } catch {
      // Fail silently
    }
  },
  async del(key: string) {
    try {
      await upstashRedis.del(key);
    } catch {
      // Fail silently
    }
  },
  async reset() {},
  async mget(...keys: string[]) {
    try {
      return upstashRedis.mget(...keys);
    } catch {
      return [];
    }
  },
  async mset(args: [string, unknown][]) {
    try {
      const pipeline = upstashRedis.pipeline();
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
      await upstashRedis.del(...keys);
    } catch {
      // Fail silently
    }
  },
  async keys(pattern: string) {
    try {
      return upstashRedis.keys(pattern);
    } catch {
      return [];
    }
  },
  async ttl(key: string) {
    try {
      return upstashRedis.ttl(key);
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
