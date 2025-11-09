import { Injectable } from '@nestjs/common';
import { FormsRepository } from './forms.repository';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { Form, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  FormNotFoundException,
  FormUnauthorizedException,
} from '@/common/exceptions/app.exceptions';
import {
  FIELD_TYPES_METADATA,
  PredefinedFieldType,
} from '@/common/types/field-types.type';

@Injectable()
export class FormsService {
  constructor(private readonly formsRepository: FormsRepository) {}

  async create(dto: CreateFormDto, userId: string): Promise<Form> {
    const passwordHash = dto.password
      ? await bcrypt.hash(dto.password, 10)
      : undefined;

    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : undefined;

    return this.formsRepository.create({
      user: { connect: { id: userId } },
      name: dto.name,
      description: dto.description,
      passwordHash,
      maxResponses: dto.maxResponses,
      expiresAt,
      successMessage: dto.successMessage,
      allowMultipleSubmissions: dto.allowMultipleSubmissions,
      fields: {
        create: dto.fields.map((field, index) => {
          const metadata = FIELD_TYPES_METADATA[field.fieldType];
          return {
            type: metadata.type,
            label: field.customLabel || metadata.label,
            name:
              field.fieldType === PredefinedFieldType.CUSTOM
                ? field.customName!
                : metadata.name,
            required: field.required,
            order: index,
            config: {
              ...metadata.validation,
              options: metadata.options,
              ...field.customConfig,
            } as Prisma.JsonObject,
          };
        }),
      },
    });
  }

  async findAll(userId: string, page = 1) {
    const limit = 15;
    const skip = (page - 1) * limit;

    const [forms, total] = await Promise.all([
      this.formsRepository.findByUserId(userId, skip, limit),
      this.formsRepository.countByUserId(userId),
    ]);

    return {
      data: forms,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string): Promise<Form> {
    const form = await this.formsRepository.findById(id);

    if (!form) {
      throw new FormNotFoundException(id);
    }

    if (form.userId !== userId) {
      throw new FormUnauthorizedException();
    }

    return form;
  }

  async update(id: string, dto: UpdateFormDto, userId: string): Promise<Form> {
    await this.findOne(id, userId);

    const passwordHash = dto.password
      ? await bcrypt.hash(dto.password, 10)
      : undefined;

    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : undefined;

    const updateData: Prisma.FormUpdateInput = {
      name: dto.name,
      description: dto.description,
      status: dto.status,
      maxResponses: dto.maxResponses,
      expiresAt,
      successMessage: dto.successMessage,
      allowMultipleSubmissions: dto.allowMultipleSubmissions,
      ...(passwordHash && { passwordHash }),
      ...(dto.fields && {
        fields: {
          deleteMany: {},
          create: dto.fields.map((field, index) => {
            const metadata = FIELD_TYPES_METADATA[field.fieldType];
            return {
              type: metadata.type,
              label: field.customLabel || metadata.label,
              name:
                field.fieldType === PredefinedFieldType.CUSTOM
                  ? field.customName!
                  : metadata.name,
              required: field.required,
              order: index,
              config: {
                ...metadata.validation,
                options: metadata.options,
                ...field.customConfig,
              } as Prisma.JsonObject,
            };
          }),
        },
      }),
    };

    return this.formsRepository.update(id, updateData);
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId);
    await this.formsRepository.softDelete(id);
  }

  async clone(id: string, userId: string): Promise<Form> {
    await this.findOne(id, userId);
    return this.formsRepository.clone(id);
  }
}
