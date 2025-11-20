import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Account, Prisma } from '@prisma/client';

@Injectable()
export class AccountsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByProvider(
    provider: string,
    providerId: string,
  ): Promise<Account | null> {
    return this.prisma.account.findUnique({
      where: {
        provider_providerId: {
          provider,
          providerId,
        },
      },
    });
  }

  async create(data: Prisma.AccountCreateInput): Promise<Account> {
    return this.prisma.account.create({ data });
  }

  async findByUserId(userId: string): Promise<Account[]> {
    return this.prisma.account.findMany({
      where: { userId },
    });
  }

  async update(id: string, data: Prisma.AccountUpdateInput): Promise<Account> {
    return this.prisma.account.update({
      where: { id },
      data,
    });
  }
}
