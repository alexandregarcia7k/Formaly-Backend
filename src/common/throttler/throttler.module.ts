import { Module, Global } from '@nestjs/common';
import {
  ThrottlerModule,
  ThrottlerGuard,
  ThrottlerStorage,
} from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { redis } from '../redis/redis.client';

// Custom storage usando Upstash Redis
class UpstashThrottlerStorage implements ThrottlerStorage {
  private readonly prefix = 'throttle:';

  async increment(
    key: string,
    ttl: number,
    limit: number,
    _blockDuration: number,
    throttlerName: string,
  ): Promise<{
    totalHits: number;
    timeToExpire: number;
    isBlocked: boolean;
    timeToBlockExpire: number;
  }> {
    const redisKey = `${this.prefix}${throttlerName}:${key}`;
    const ttlSeconds = Math.ceil(ttl / 1000);

    try {
      const pipeline = redis.pipeline();
      pipeline.incr(redisKey);
      pipeline.expire(redisKey, ttlSeconds);
      pipeline.ttl(redisKey);
      const results = await pipeline.exec();

      // ioredis: [[null, value], ...], Upstash: [value, ...]
      const count = Array.isArray(results[0]) ? results[0][1] : results[0];
      const ttlRemaining = Array.isArray(results[2])
        ? results[2][1]
        : results[2];
      const countNum = typeof count === 'number' ? count : 0;
      const ttlNum = typeof ttlRemaining === 'number' ? ttlRemaining : -1;

      return {
        totalHits: countNum,
        timeToExpire: ttlNum > 0 ? ttlNum * 1000 : ttl,
        isBlocked: countNum > limit,
        timeToBlockExpire: ttlNum > 0 ? ttlNum * 1000 : 0,
      };
    } catch {
      // Fallback: bloquear request se Redis falhar (fail-secure)
      return {
        totalHits: limit + 1,
        timeToExpire: ttl,
        isBlocked: true,
        timeToBlockExpire: ttl,
      };
    }
  }
}

const THROTTLE_CONFIG = {
  DEFAULT: { ttl: 60000, limit: 10 }, // 1 minuto - padrão
  AUTH_REGISTER: { ttl: 60000, limit: 3 }, // 1 minuto - registro
  AUTH_LOGIN: { ttl: 60000, limit: 5 }, // 1 minuto - login
  AUTH_FORGOT: { ttl: 3600000, limit: 3 }, // 1 hora - forgot password
  FORM_VALIDATE: { ttl: 60000, limit: 5 }, // 1 minuto - validar senha
  FORM_SUBMIT: { ttl: 60000, limit: 3 }, // 1 minuto - enviar resposta
} as const;

@Global()
@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        { name: 'default', ...THROTTLE_CONFIG.DEFAULT },
        { name: 'auth-register', ...THROTTLE_CONFIG.AUTH_REGISTER },
        { name: 'auth-login', ...THROTTLE_CONFIG.AUTH_LOGIN },
        { name: 'auth-forgot', ...THROTTLE_CONFIG.AUTH_FORGOT },
        { name: 'form-validate', ...THROTTLE_CONFIG.FORM_VALIDATE },
        { name: 'form-submit', ...THROTTLE_CONFIG.FORM_SUBMIT },
      ],
      storage: new UpstashThrottlerStorage(),
      skipIf: (context) => {
        const request = context.switchToHttp().getRequest();
        return request.url === '/health';
      },
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [ThrottlerModule],
})
export class AppThrottlerModule {}
