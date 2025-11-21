import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { FormsRepository } from './forms.repository';
import { ActivityRepository } from '../dashboard/activity.repository';
import { CACHE_KEYS } from '@/common/constants/cache.constants';
import { CreateFormDto, FieldInput } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import type { FindAllFiltersInput } from './dto/find-all-filters.dto';
import type { FieldConfig } from '@/common/types/field-config.type';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  FormNotFoundException,
  FormUnauthorizedException,
  ValidationException,
} from '@/common/exceptions/app.exceptions';

interface FormField {
  id: string;
  type: string;
  label: string;
  name: string;
  required: boolean;
  config: FieldConfig | null;
}

export interface FormattedForm {
  id: string;
  name: string;
  description: string | null;
  status: string;
  isPublic: boolean;
  hasPassword: boolean;
  totalResponses: number;
  totalViews: number;
  lastResponseAt: Date | null;
  maxResponses: number | null;
  expiresAt: Date | null;
  allowMultipleSubmissions: boolean;
  fields?: FormField[];
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class FormsService {
  private readonly BCRYPT_ROUNDS = 10;

  constructor(
    private readonly formsRepository: FormsRepository,
    private readonly activityRepository: ActivityRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(dto: CreateFormDto, userId: string): Promise<FormattedForm> {
    this.validateFieldOptions(dto.fields);

    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : undefined;

    const formData: Prisma.FormCreateInput = {
      user: { connect: { id: userId } },
      name: dto.name,
      description: dto.description,
      maxResponses: dto.maxResponses,
      expiresAt,
      allowMultipleSubmissions: dto.allowMultipleSubmissions,
      fields: {
        create: dto.fields.map((field) => ({
          type: field.type,
          label: field.label,
          name: field.name,
          required: field.required,
          config: this.buildFieldConfig(field),
        })),
      },
    };

    if (dto.password) {
      formData.password = {
        create: {
          hash: await this.hashPassword(dto.password),
        },
      };
    }

    const form = await this.formsRepository.create(formData);

    this.activityRepository
      .create({
        type: 'form_created',
        formId: form.id,
        message: `Formulário "${form.name}" criado`,
        user: { connect: { id: userId } },
      })
      .catch(() => {
        // Fail silently
      });

    return this.formatFormResponse(form, true);
  }

  async findAll(
    userId: string,
    filters: FindAllFiltersInput,
  ): Promise<{
    data: FormattedForm[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    const skip = (filters.page - 1) * filters.pageSize;

    const [forms, total] = await Promise.all([
      this.formsRepository.findByUserIdWithFilters(
        userId,
        filters,
        skip,
        filters.pageSize,
      ),
      this.formsRepository.countByUserIdWithFilters(userId, filters),
    ]);

    return {
      data: forms.map((form) => this.formatFormResponse(form, false)),
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        total,
        totalPages: Math.ceil(total / filters.pageSize),
      },
    };
  }

  async findOne(id: string, userId: string): Promise<FormattedForm> {
    const form = await this.formsRepository.findById(id);

    if (!form) {
      throw new FormNotFoundException(id);
    }

    if (form.userId !== userId) {
      throw new FormUnauthorizedException();
    }

    return this.formatFormResponse(form, true);
  }

  async update(
    id: string,
    dto: UpdateFormDto,
    userId: string,
  ): Promise<FormattedForm> {
    const existingForm = await this.formsRepository.findById(id);

    if (!existingForm) {
      throw new FormNotFoundException(id);
    }

    if (existingForm.userId !== userId) {
      throw new FormUnauthorizedException();
    }

    if (dto.fields) {
      this.validateFieldOptions(dto.fields);
    }

    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : undefined;

    const updateData: Prisma.FormUpdateInput = {
      name: dto.name,
      description: dto.description,
      status: dto.status,
      maxResponses: dto.maxResponses,
      expiresAt,
      allowMultipleSubmissions: dto.allowMultipleSubmissions,
      ...(dto.fields && {
        fields: {
          deleteMany: {},
          create: dto.fields.map((field) => ({
            type: field.type,
            label: field.label,
            name: field.name,
            required: field.required,
            config: this.buildFieldConfig(field),
          })),
        },
      }),
    };

    if (dto.password === '') {
      updateData.password = { delete: true };
    } else if (dto.password) {
      const passwordHash = await this.hashPassword(dto.password);
      updateData.password = {
        upsert: {
          create: { hash: passwordHash },
          update: { hash: passwordHash },
        },
      };
    }

    // Invalidar cache ANTES do update
    await this.invalidateCache(id);

    const form = await this.formsRepository.update(id, updateData);

    const statusChanged = dto.status && dto.status !== existingForm.status;
    this.activityRepository
      .create({
        type: statusChanged ? 'form_status_changed' : 'form_updated',
        formId: form.id,
        message: statusChanged
          ? `Formulário "${form.name}" ${dto.status === 'ACTIVE' ? 'ativado' : 'desativado'}`
          : `Formulário "${form.name}" atualizado`,
        user: { connect: { id: userId } },
      })
      .catch(() => {
        // Fail silently
      });

    return this.formatFormResponse(form, true);
  }

  async remove(id: string, userId: string): Promise<void> {
    const existingForm = await this.findOne(id, userId);

    // Invalidar cache ANTES do delete
    await this.invalidateCache(id);

    await this.formsRepository.delete(id);

    this.activityRepository
      .create({
        type: 'form_deleted',
        message: `Formulário "${existingForm.name}" deletado`,
        user: { connect: { id: userId } },
      })
      .catch(() => {
        // Fail silently
      });
  }

  async clone(id: string, userId: string): Promise<FormattedForm> {
    await this.findOne(id, userId);
    const form = await this.formsRepository.clone(id);

    this.activityRepository
      .create({
        type: 'form_cloned',
        formId: form.id,
        message: `Formulário "${form.name}" clonado`,
        user: { connect: { id: userId } },
      })
      .catch(() => {
        // Fail silently
      });

    return this.formatFormResponse(form, true);
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.BCRYPT_ROUNDS);
  }

  private buildFieldConfig(field: FieldInput): Prisma.JsonObject {
    return {
      ...(field.config || {}),
      ...(field.placeholder && { placeholder: field.placeholder }),
    } as Prisma.JsonObject;
  }

  private validateFieldOptions(fields: FieldInput[]): void {
    const fieldsWithOptions = ['select', 'radio', 'checkbox'];

    for (const field of fields) {
      if (fieldsWithOptions.includes(field.type)) {
        const options = field.config?.options;
        if (!options || !Array.isArray(options) || options.length === 0) {
          throw new ValidationException(
            `Campo "${field.label}" do tipo "${field.type}" deve ter opções`,
          );
        }
      }
    }
  }

  private async invalidateCache(formId: string): Promise<void> {
    try {
      await this.cacheManager.del(CACHE_KEYS.PUBLIC_FORM(formId));
    } catch {
      // Fail silently
    }
  }

  private formatFormResponse(
    form: {
      id: string;
      name: string;
      description: string | null;
      status: string;
      password?: { hash: string } | null;
      totalResponses: number;
      totalViews: number;
      lastResponseAt: Date | null;
      maxResponses: number | null;
      expiresAt: Date | null;
      allowMultipleSubmissions: boolean;
      fields?: FormField[];
      createdAt: Date;
      updatedAt: Date;
    },
    includeFields: boolean,
  ): FormattedForm {
    return {
      id: form.id,
      name: form.name,
      description: form.description,
      status: form.status,
      isPublic: !form.password,
      hasPassword: !!form.password,
      totalResponses: form.totalResponses,
      totalViews: form.totalViews,
      lastResponseAt: form.lastResponseAt,
      maxResponses: form.maxResponses,
      expiresAt: form.expiresAt,
      allowMultipleSubmissions: form.allowMultipleSubmissions,
      ...(includeFields && { fields: form.fields }),
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
    };
  }
}
