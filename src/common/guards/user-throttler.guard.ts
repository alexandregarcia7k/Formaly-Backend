import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Se usuário autenticado, usar userId
    if (req.user?.id) {
      return `user:${req.user.id}`;
    }

    // Se não autenticado, usar IP (rotas públicas)
    return req.ip || req.connection?.remoteAddress || 'unknown';
  }
}
