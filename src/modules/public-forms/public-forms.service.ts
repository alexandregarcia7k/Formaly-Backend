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
  ValidationException,
} from '@/common/exceptions/app.exceptions';

@Injectable()
export class PublicFormsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicForm(id: string) {
    const form = await this.prisma.form.findUnique({
      where: { id },
      include: {
        fields: true,
        password: true,
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
      requiresPassword: !!form.password,
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
      where: { id },
      include: { password: true },
    });

    if (!form) {
      throw new FormNotFoundException(id);
    }

    if (!form.password) {
      return true;
    }

    const isValid = await bcrypt.compare(password, form.password.hash);

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
      where: { id },
      include: { fields: true, password: true },
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

    if (form.password && !dto.password) {
      throw new FormPasswordRequiredException();
    }

    if (form.password && dto.password) {
      await this.validatePassword(id, dto.password);
    }

    const fingerprint = this.generateFingerprint(ip, userAgent);

    if (!form.allowMultipleSubmissions) {
      const existingSubmission = await this.prisma.formSubmission.findFirst({
        where: { formId: id, ipAddress: ip },
      });

      if (existingSubmission) {
        throw new SubmissionDuplicateException();
      }
    }

    // Validar campos obrigatórios
    const requiredFields = form.fields.filter((f) => f.required);
    const missingFields = requiredFields.filter(
      (field) =>
        dto.values[field.name] === undefined ||
        dto.values[field.name] === null ||
        dto.values[field.name] === '',
    );

    if (missingFields.length > 0) {
      throw new ValidationException(
        `Campos obrigatórios não preenchidos: ${missingFields.map((f) => f.label).join(', ')}`,
      );
    }

    const submission = await this.prisma.formSubmission.create({
      data: {
        formId: id,
        ipAddress: ip,
        userAgent,
        values: {
          create: Object.entries(dto.values)
            .filter(([key]) => form.fields.some((f) => f.name === key))
            .map(([key, value]) => {
              const field = form.fields.find((f) => f.name === key)!;
              return {
                fieldId: field.id,
                type: field.type,
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
      message: 'Resposta enviada com sucesso! Obrigado.',
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
}
