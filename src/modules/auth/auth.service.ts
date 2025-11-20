import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersRepository } from '../users/users.repository';
import { AccountsRepository } from './accounts.repository';
import { PasswordResetTokenRepository } from './password-reset-token.repository';
import { SyncUserDto } from './dto/sync-user.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { randomBytes } from 'crypto';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  InvalidCredentialsException,
  UserAlreadyExistsException,
  OAuthAccountExistsException,
  InvalidResetTokenException,
} from '@/common/exceptions/app.exceptions';
import { SuccessMessages } from '@/common/types/error-response.type';

interface JwtPayload {
  sub: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  accessToken: string;
}

@Injectable()
export class AuthService {
  private readonly BCRYPT_ROUNDS = 10;

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersRepository: UsersRepository,
    private readonly accountsRepository: AccountsRepository,
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
  ) {}

  async syncUser(dto: SyncUserDto): Promise<AuthResponse> {
    let user = await this.usersRepository.findByEmail(dto.email);

    if (!user) {
      user = await this.usersRepository.create({
        email: dto.email,
        name: dto.name,
        image: dto.image,
      });
    } else {
      user = await this.usersRepository.update(user.id, {
        name: dto.name,
        image: dto.image,
      });
    }

    const existingAccount = await this.accountsRepository.findByProvider(
      dto.provider,
      dto.providerId,
    );

    if (!existingAccount) {
      await this.accountsRepository.create({
        user: { connect: { id: user.id } },
        provider: dto.provider,
        providerId: dto.providerId,
        accessToken: dto.accessToken,
        refreshToken: dto.refreshToken,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt * 1000) : null,
      });
    } else {
      await this.accountsRepository.update(existingAccount.id, {
        accessToken: dto.accessToken,
        refreshToken: dto.refreshToken,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt * 1000) : null,
      });
    }

    const accessToken = await this.generateToken(user);
    return this.sanitizeUserResponse(user, accessToken);
  }

  private async generateToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    };

    return this.jwtService.signAsync(payload);
  }

  private sanitizeUserResponse(user: User, accessToken: string): AuthResponse {
    const { password: _password, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      accessToken,
    };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.usersRepository.findById(userId);
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.usersRepository.findByEmail(dto.email);

    if (existingUser) {
      const accounts = await this.accountsRepository.findByUserId(
        existingUser.id,
      );

      if (accounts.length > 0) {
        throw new OAuthAccountExistsException(accounts[0].provider);
      }

      throw new UserAlreadyExistsException();
    }

    const passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_ROUNDS);

    const user = await this.usersRepository.create({
      email: dto.email,
      name: dto.name,
      password: passwordHash,
    });

    const accessToken = await this.generateToken(user);
    return this.sanitizeUserResponse(user, accessToken);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersRepository.findByEmailWithAccounts(dto.email);

    if (!user) {
      throw new InvalidCredentialsException();
    }

    if (!user.password) {
      const provider = user.accounts[0]?.provider || 'OAuth';
      throw new InvalidCredentialsException(
        `Esta conta foi criada via ${provider}. Faça login com ${provider} ou defina uma senha.`,
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new InvalidCredentialsException();
    }

    const accessToken = await this.generateToken(user);
    return this.sanitizeUserResponse(user, accessToken);
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.usersRepository.findByEmail(dto.email);

    if (!user) {
      return { message: SuccessMessages.PASSWORD_RESET_EMAIL_SENT };
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.passwordResetTokenRepository.create({
      token,
      expiresAt,
      user: { connect: { id: user.id } },
    });

    // TODO: Implementar envio de email real
    // await this.emailService.sendPasswordReset(user.email, token);

    return { message: SuccessMessages.PASSWORD_RESET_EMAIL_SENT };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const resetToken = await this.passwordResetTokenRepository.findByToken(
      dto.token,
    );

    if (!resetToken) {
      throw new InvalidResetTokenException('invalid');
    }

    if (resetToken.used) {
      throw new InvalidResetTokenException('used');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new InvalidResetTokenException('expired');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, this.BCRYPT_ROUNDS);

    await this.usersRepository.update(resetToken.userId, {
      password: passwordHash,
    });

    await this.passwordResetTokenRepository.markAsUsed(resetToken.id);

    return { message: SuccessMessages.PASSWORD_RESET_SUCCESS };
  }
}
