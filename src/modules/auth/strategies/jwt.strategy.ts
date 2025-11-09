import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { jwtConfig } from '@/config/jwt.config';
import { AuthService } from '../auth.service';
import { User } from '@prisma/client';
import {
  TokenInvalidException,
  UserNotFoundException,
} from '@/common/exceptions/app.exceptions';

interface JwtPayload {
  sub: string;
  email: string;
  name: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.accessToken;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.secret,
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    if (!payload.sub) {
      throw new TokenInvalidException();
    }

    const user = await this.authService.validateUser(payload.sub);

    if (!user) {
      throw new UserNotFoundException(payload.sub);
    }

    return user;
  }
}
