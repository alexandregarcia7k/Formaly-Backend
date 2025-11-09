import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitResponseDto } from './dto/submit-response.dto';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import {
  FormNotFoundException,
  FormInactiveException,
  FormExpiredException,
  FormFullException,
  FormPasswordRequiredException,
  FormPasswordInvalidException,
  SubmissionDuplicateException,
} from '@/common/exceptions/app.exceptions';

@Injectable()
export class PublicFormsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicForm(id: string) {
    const form = await this.prisma.form.findUnique({
      where: { id, deletedAt: null },
      include: {
        fields: { orderBy: { order: 'asc' } },
        _count: { select: { submissions: true } },
      },
    });

    if (!form) {
      throw new FormNotFoundException(id);
    }

    if (form.status === 'INACTIVE') {
      throw new FormInactiveException();
    }

    if (form.expiresAt && form.expiresAt < new Date()) {
      throw new FormExpiredException();
    }

    if (form.maxResponses && form._count.submissions >= form.maxResponses) {
      throw new FormFullException();
    }

    return {
      id: form.id,
      name: form.name,
      description: form.description,
      successMessage: form.successMessage,
      requiresPassword: !!form.passwordHash,
      fields: form.fields.map((field) => ({
        id: field.id,
        type: field.type,
        label: field.label,
        name: field.name,
        required: field.required,
        config: field.config,
      })),
    };
  }

  async validatePassword(id: string, password: string): Promise<boolean> {
    const form = await this.prisma.form.findUnique({
      where: { id, deletedAt: null },
      select: { passwordHash: true },
    });

    if (!form) {
      throw new FormNotFoundException(id);
    }

    if (!form.passwordHash) {
      return true;
    }

    const isValid = await bcrypt.compare(password, form.passwordHash);

    if (!isValid) {
      throw new FormPasswordInvalidException();
    }

    return true;
  }

  async submitResponse(
    id: string,
    dto: SubmitResponseDto,
    userAgent?: string,
    ip?: string,
  ) {
    const form = await this.prisma.form.findUnique({
      where: { id, deletedAt: null },
      include: { fields: true },
    });

    if (!form) {
      throw new FormNotFoundException(id);
    }

    if (form.status === 'INACTIVE') {
      throw new FormInactiveException();
    }

    if (form.expiresAt && form.expiresAt < new Date()) {
      throw new FormExpiredException();
    }

    const submissionsCount = await this.prisma.formSubmission.count({
      where: { formId: id },
    });

    if (form.maxResponses && submissionsCount >= form.maxResponses) {
      throw new FormFullException();
    }

    if (form.passwordHash && !dto.password) {
      throw new FormPasswordRequiredException();
    }

    if (form.passwordHash && dto.password) {
      await this.validatePassword(id, dto.password);
    }

    const fingerprint = this.generateFingerprint(ip, userAgent);

    if (!form.allowMultipleSubmissions) {
      const existingSubmission = await this.prisma.formSubmission.findFirst({
        where: { formId: id, fingerprint },
      });

      if (existingSubmission) {
        throw new SubmissionDuplicateException();
      }
    }

    const device = this.detectDevice(userAgent);

    const submission = await this.prisma.formSubmission.create({
      data: {
        formId: id,
        userId: form.userId,
        fingerprint,
        respondentEmail: dto.respondentEmail,
        respondentName: dto.respondentName,
        userAgent,
        device,
        values: {
          create: Object.entries(dto.values).map(([key, value]) => {
            const field = form.fields.find((f) => f.name === key);
            return {
              fieldId: field?.id,
              fieldLabel: field?.label || key,
              fieldType: field?.type || 'text',
              value: value as Prisma.InputJsonValue,
            };
          }),
        },
      },
      include: {
        values: true,
      },
    });

    return {
      id: submission.id,
      message: form.successMessage || 'Resposta enviada com sucesso! Obrigado.',
    };
  }

  async trackView(id: string, ip?: string, userAgent?: string) {
    const fingerprint = this.generateFingerprint(ip, userAgent);

    await this.prisma.formView.upsert({
      where: {
        formId_fingerprint: {
          formId: id,
          fingerprint,
        },
      },
      create: {
        formId: id,
        fingerprint,
      },
      update: {},
    });
  }

  private generateFingerprint(ip?: string, userAgent?: string): string {
    const data = `${ip || 'unknown'}-${userAgent || 'unknown'}`;
    return createHash('sha256').update(data).digest('hex');
  }

  private detectDevice(userAgent?: string): string {
    if (!userAgent) return 'unknown';
    const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);
    return isMobile ? 'mobile' : 'desktop';
  }
}
