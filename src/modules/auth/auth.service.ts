import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersRepository } from '../users/users.repository';
import { AccountsRepository } from './accounts.repository';
import { SyncUserDto } from './dto/sync-user.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  InvalidCredentialsException,
  UserAlreadyExistsException,
} from '@/common/exceptions/app.exceptions';

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
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersRepository: UsersRepository,
    private readonly accountsRepository: AccountsRepository,
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
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
    };
  }

  private async generateToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    };

    return this.jwtService.signAsync(payload);
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.usersRepository.findById(userId);
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.usersRepository.findByEmail(dto.email);

    if (existingUser) {
      throw new UserAlreadyExistsException();
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.usersRepository.create({
      email: dto.email,
      name: dto.name,
      password: passwordHash,
    });

    const accessToken = await this.generateToken(user);
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersRepository.findByEmail(dto.email);

    if (!user || !user.password) {
      throw new InvalidCredentialsException();
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new InvalidCredentialsException();
    }

    const accessToken = await this.generateToken(user);
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
    };
  }
}
