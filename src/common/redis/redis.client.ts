import { Redis } from '@upstash/redis';
import { Redis as IORedis } from 'ioredis';

type PipelineResult = Array<[Error | null, unknown]> | unknown[];

interface RedisPipeline {
  incr(key: string): RedisPipeline;
  set(key: string, value: string): RedisPipeline;
  del(key: string): RedisPipeline;
  expire(key: string, seconds: number): RedisPipeline;
  ttl(key: string): RedisPipeline;
  exec(): Promise<PipelineResult>;
}

const isUpstash =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;
const isLocal = process.env.REDIS_URL;

if (!isUpstash && !isLocal) {
  throw new Error(
    'Redis configuration required: Either UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (production) or REDIS_URL (local/docker)',
  );
}

let upstashRedis: Redis | null = null;
if (isUpstash) {
  upstashRedis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

let localRedis: IORedis | null = null;
if (isLocal) {
  localRedis = new IORedis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false,
    retryStrategy: (times) => {
      if (times > 10) return null;
      return Math.min(times * 100, 3000);
    },
    reconnectOnError: (err) => {
      const targetErrors = ['READONLY', 'ECONNRESET'];
      return targetErrors.some((e) => err.message.includes(e));
    },
  });

  localRedis.on('error', (err) => {
    console.error('Redis connection error:', err.message);
  });

  localRedis.on('connect', () => {
    console.log('Redis connected');
  });
}

export const redis = {
  async get(key: string): Promise<string | null> {
    if (upstashRedis) {
      return upstashRedis.get(key);
    }
    return localRedis!.get(key);
  },

  async set(
    key: string,
    value: string,
    options?: { ex?: number },
  ): Promise<void> {
    if (upstashRedis) {
      if (options?.ex) {
        await upstashRedis.set(key, value, { ex: options.ex });
      } else {
        await upstashRedis.set(key, value);
      }
    } else {
      if (options?.ex) {
        await localRedis!.setex(key, options.ex, value);
      } else {
        await localRedis!.set(key, value);
      }
    }
  },

  async del(key: string): Promise<void> {
    if (upstashRedis) {
      await upstashRedis.del(key);
    } else {
      await localRedis!.del(key);
    }
  },

  async incr(key: string): Promise<number> {
    if (upstashRedis) {
      return upstashRedis.incr(key);
    }
    return localRedis!.incr(key);
  },

  async expire(key: string, seconds: number): Promise<void> {
    if (upstashRedis) {
      await upstashRedis.expire(key, seconds);
    } else {
      await localRedis!.expire(key, seconds);
    }
  },

  async ttl(key: string): Promise<number> {
    if (upstashRedis) {
      return upstashRedis.ttl(key);
    }
    return localRedis!.ttl(key);
  },

  async exists(key: string): Promise<number> {
    if (upstashRedis) {
      return upstashRedis.exists(key);
    }
    return localRedis!.exists(key);
  },

  async setex(key: string, seconds: number, value: string): Promise<void> {
    if (upstashRedis) {
      await upstashRedis.set(key, value, { ex: seconds });
    } else {
      await localRedis!.setex(key, seconds, value);
    }
  },

  pipeline(): RedisPipeline {
    if (upstashRedis) {
      return upstashRedis.pipeline() as unknown as RedisPipeline;
    }
    return localRedis!.pipeline() as unknown as RedisPipeline;
  },
};

export async function closeRedis(): Promise<void> {
  if (localRedis) {
    await localRedis.quit();
  }
}

export { upstashRedis };
