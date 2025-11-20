import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AccountsRepository } from './accounts.repository';
import { PasswordResetTokenRepository } from './password-reset-token.repository';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { jwtConfig } from '@/config/jwt.config';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      global: true,
      secret: jwtConfig.secret,
      signOptions: {
        expiresIn: '7d',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AccountsRepository,
    PasswordResetTokenRepository,
    JwtStrategy,
  ],
  exports: [AuthService, JwtStrategy],
})
export class AuthModule {}
