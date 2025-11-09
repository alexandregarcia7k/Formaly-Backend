import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Form, Prisma } from '@prisma/client';

@Injectable()
export class FormsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.FormCreateInput): Promise<Form> {
    return this.prisma.form.create({
      data,
      include: {
        fields: true,
        _count: { select: { submissions: true } },
      },
    });
  }

  async findById(id: string): Promise<Form | null> {
    return this.prisma.form.findUnique({
      where: { id },
      include: {
        fields: { orderBy: { order: 'asc' } },
        _count: { select: { submissions: true } },
      },
    });
  }

  async findByUserId(
    userId: string,
    skip: number,
    take: number,
  ): Promise<Form[]> {
    return this.prisma.form.findMany({
      where: { userId, deletedAt: null },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { submissions: true } },
      },
    });
  }

  async countByUserId(userId: string): Promise<number> {
    return this.prisma.form.count({
      where: { userId, deletedAt: null },
    });
  }

  async update(id: string, data: Prisma.FormUpdateInput): Promise<Form> {
    return this.prisma.form.update({
      where: { id },
      data,
      include: {
        fields: { orderBy: { order: 'asc' } },
        _count: { select: { submissions: true } },
      },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.form.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async clone(formId: string): Promise<Form> {
    const original = await this.prisma.form.findUnique({
      where: { id: formId },
      include: { fields: true },
    });

    if (!original) {
      throw new Error('Form not found');
    }

    return this.prisma.form.create({
      data: {
        userId: original.userId,
        name: `${original.name} (cópia)`,
        description: original.description,
        status: original.status,
        passwordHash: original.passwordHash,
        maxResponses: original.maxResponses,
        expiresAt: original.expiresAt,
        successMessage: original.successMessage,
        allowMultipleSubmissions: original.allowMultipleSubmissions,
        clonedFromId: original.id,
        fields: {
          create: original.fields.map((field, index) => ({
            type: field.type,
            label: field.label,
            name: field.name,
            required: field.required,
            order: index,
            config: field.config as Prisma.JsonObject,
          })),
        },
      },
      include: {
        fields: { orderBy: { order: 'asc' } },
        _count: { select: { submissions: true } },
      },
    });
  }
}
