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
        fields: true,
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
      where: { userId },
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
      where: { userId },
    });
  }

  async update(id: string, data: Prisma.FormUpdateInput): Promise<Form> {
    return this.prisma.form.update({
      where: { id },
      data,
      include: {
        fields: true,
        _count: { select: { submissions: true } },
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.form.delete({
      where: { id },
    });
  }

  async clone(formId: string): Promise<Form> {
    const original = await this.prisma.form.findUnique({
      where: { id: formId },
      include: { fields: true, password: true },
    });

    const cloneData: Prisma.FormCreateInput = {
      user: { connect: { id: original!.userId } },
      name: `${original!.name} (cópia)`,
      description: original!.description,
      status: original!.status,
      maxResponses: original!.maxResponses,
      expiresAt: original!.expiresAt,
      allowMultipleSubmissions: original!.allowMultipleSubmissions,
      fields: {
        create: original!.fields.map((field) => ({
          type: field.type,
          label: field.label,
          name: field.name,
          required: field.required,
          config: field.config as Prisma.JsonObject,
        })),
      },
    };

    // Clonar senha se existir
    if (original!.password) {
      cloneData.password = {
        create: { hash: original!.password.hash },
      };
    }

    return this.prisma.form.create({
      data: cloneData,
      include: {
        fields: true,
        _count: { select: { submissions: true } },
      },
    });
  }
}
