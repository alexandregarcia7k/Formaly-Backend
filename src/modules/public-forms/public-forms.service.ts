import { Injectable } from '@nestjs/common';
import { PublicFormsRepository } from './public-forms.repository';
import { ActivityRepository } from '../dashboard/activity.repository';
import { CacheService } from '@/common/services/cache.service';
import { SubmitResponseDto } from './dto/submit-response.dto';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { CACHE_KEYS, CACHE_TTL } from '@/common/constants/cache.constants';
import {
  FormNotFoundException,
  FormInactiveException,
  FormExpiredException,
  FormFullException,
  FormPasswordRequiredException,
  FormPasswordInvalidException,
  ValidationException,
} from '@/common/exceptions/app.exceptions';

import type { FieldConfig } from '@/common/types/field-config.type';

export interface PublicFormResponse {
  id: string;
  name: string;
  description: string | null;
  requiresPassword: boolean;
  fields: Array<{
    id: string;
    type: string;
    label: string;
    name: string;
    required: boolean;
    config: FieldConfig | null;
  }>;
}

@Injectable()
export class PublicFormsService {
  constructor(
    private readonly repository: PublicFormsRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly cacheService: CacheService,
  ) {}

  async getPublicForm(
    id: string,
    userAgent?: string,
    ip?: string,
  ): Promise<PublicFormResponse> {
    const cacheKey = CACHE_KEYS.PUBLIC_FORM(id);

    const cached = await this.cacheService.get<PublicFormResponse>(cacheKey);
    if (cached) {
      // SEMPRE validar status atual (query otimizada)
      await this.validateFormStatus(id);

      // Registrar view em background (não bloqueia resposta)
      const fingerprint = this.generateFingerprint(ip, userAgent);
      this.repository.createView(id, fingerprint).catch(() => {});
      return cached;
    }

    // Buscar do banco
    const form = await this.validateFormAccess(id);

    const response: PublicFormResponse = {
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
        config: field.config as FieldConfig | null,
      })),
    };

    this.cacheService
      .set(cacheKey, response, CACHE_TTL.PUBLIC_FORM)
      .catch(() => {});

    // Registrar view em background
    const fingerprint = this.generateFingerprint(ip, userAgent);
    this.repository.createView(id, fingerprint).catch(() => {});

    return response;
  }

  async validatePassword(id: string, password: string): Promise<boolean> {
    const form = await this.repository.findById(id);

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
    const form = await this.validateFormAccess(id);

    if (form.password && !dto.password) {
      throw new FormPasswordRequiredException();
    }

    if (form.password && dto.password) {
      const isValid = await bcrypt.compare(dto.password, form.password.hash);
      if (!isValid) {
        throw new FormPasswordInvalidException();
      }
    }

    if (!form.allowMultipleSubmissions && ip) {
      const existing = await this.repository.findSubmissionByIp(id, ip);
      if (existing) {
        throw new ValidationException('Você já respondeu este formulário');
      }
    }

    const requiredFields = form.fields.filter((f) => f.required);
    const missingFields = requiredFields.filter((field) => {
      const value = dto.values[field.name];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      throw new ValidationException(
        `Campos obrigatórios não preenchidos: ${missingFields.map((f) => f.label).join(', ')}`,
      );
    }

    const submission = await this.repository.createSubmissionWithStats(id, {
      form: { connect: { id } },
      ipAddress: ip,
      userAgent,
      startedAt: dto.metadata?.startedAt
        ? new Date(dto.metadata.startedAt)
        : undefined,
      completedAt: dto.metadata?.completedAt
        ? new Date(dto.metadata.completedAt)
        : undefined,
      timeSpent: dto.metadata?.timeSpent,
      values: {
        create: Object.entries(dto.values)
          .filter(([key]) => form.fields.some((f) => f.name === key))
          .map(([key, value]) => {
            const field = form.fields.find((f) => f.name === key)!;
            return {
              field: { connect: { id: field.id } },
              type: field.type,
              value: value as Prisma.InputJsonValue,
            };
          }),
      },
    });

    this.activityRepository
      .create({
        type: 'response_received',
        formId: form.id,
        message: `Nova resposta no formulário "${form.name}"`,
        user: { connect: { id: form.userId } },
      })
      .catch(() => {});

    return {
      id: submission.id,
      message: 'Resposta enviada com sucesso',
    };
  }

  private async validateFormStatus(id: string) {
    const form = await this.repository.findStatusById(id);
    this.checkFormAccess(form, id);
  }

  private async validateFormAccess(id: string) {
    const form = await this.repository.findById(id);
    this.checkFormAccess(form, id);
    return form;
  }

  private checkFormAccess(
    form: {
      status: string;
      expiresAt: Date | null;
      maxResponses: number | null;
      totalResponses: number;
    } | null,
    id: string,
  ): asserts form is NonNullable<typeof form> {
    if (!form) {
      throw new FormNotFoundException(id);
    }

    if (form.status === 'INACTIVE') {
      throw new FormInactiveException();
    }

    if (form.expiresAt && form.expiresAt < new Date()) {
      throw new FormExpiredException();
    }

    if (form.maxResponses && form.totalResponses >= form.maxResponses) {
      throw new FormFullException();
    }
  }

  private generateFingerprint(ip?: string, userAgent?: string): string {
    const data = `${ip || 'unknown'}-${userAgent || 'unknown'}`;
    return createHash('sha256').update(data).digest('hex');
  }
}
