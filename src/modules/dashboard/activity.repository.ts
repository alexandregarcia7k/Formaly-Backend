import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma, Activity } from '@prisma/client';

@Injectable()
export class ActivityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.ActivityCreateInput): Promise<Activity> {
    return await this.prisma.activity.create({ data });
  }

  async findLatest(userId: string, limit: number) {
    return await this.prisma.activity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        type: true,
        formId: true,
        message: true,
        createdAt: true,
      },
    });
  }

  async count(userId: string): Promise<number> {
    return await this.prisma.activity.count({
      where: { userId },
    });
  }
}
