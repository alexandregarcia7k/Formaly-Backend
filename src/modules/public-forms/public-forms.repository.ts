import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PublicFormsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.form.findUnique({
      where: { id },
      include: {
        fields: true,
        password: true,
      },
    });
  }

  async findStatusById(id: string) {
    return this.prisma.form.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        expiresAt: true,
        maxResponses: true,
        totalResponses: true,
      },
    });
  }

  async findSubmissionByIp(formId: string, ipAddress: string) {
    return this.prisma.formSubmission.findFirst({
      where: { formId, ipAddress },
    });
  }

  async createView(formId: string, fingerprint: string): Promise<void> {
    return this.prisma.$transaction(async (tx) => {
      try {
        await tx.formView.create({
          data: { formId, fingerprint },
        });
        await tx.form.update({
          where: { id: formId },
          data: { totalViews: { increment: 1 } },
        });
      } catch {
        // View já existe, não incrementa
      }
    });
  }

  async createSubmissionWithStats(
    formId: string,
    data: Prisma.FormSubmissionCreateInput,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const submission = await tx.formSubmission.create({
        data,
        include: { values: true },
      });

      await tx.form.update({
        where: { id: formId },
        data: {
          totalResponses: { increment: 1 },
          lastResponseAt: new Date(),
        },
      });

      return submission;
    });
  }
}
