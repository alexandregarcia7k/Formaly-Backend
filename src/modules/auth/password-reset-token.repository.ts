import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordResetToken, Prisma } from '@prisma/client';

@Injectable()
export class PasswordResetTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.PasswordResetTokenCreateInput,
  ): Promise<PasswordResetToken> {
    return await this.prisma.passwordResetToken.create({ data });
  }

  async findByToken(token: string): Promise<PasswordResetToken | null> {
    return await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  async markAsUsed(id: string): Promise<PasswordResetToken> {
    return await this.prisma.passwordResetToken.update({
      where: { id },
      data: { used: true },
    });
  }

  async deleteExpired(): Promise<number> {
    const result = await this.prisma.passwordResetToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { used: true }],
      },
    });
    return result.count;
  }
}
