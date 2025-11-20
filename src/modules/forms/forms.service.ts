import { Injectable } from '@nestjs/common';
import { FormsRepository } from './forms.repository';
import { CreateFormDto, FieldInput } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { Form, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  FormNotFoundException,
  FormUnauthorizedException,
} from '@/common/exceptions/app.exceptions';

@Injectable()
export class FormsService {
  constructor(private readonly formsRepository: FormsRepository) {}

  async create(dto: CreateFormDto, userId: string): Promise<Form> {
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
          config: {
            ...(field.config || {}),
            ...(field.placeholder && { placeholder: field.placeholder }),
          } as Prisma.JsonObject,
        })),
      },
    };

    // Se tem senha, criar FormPassword separado
    if (dto.password) {
      formData.password = {
        create: {
          hash: await bcrypt.hash(dto.password, 10),
        },
      };
    }

    return this.formsRepository.create(formData);
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
            config: {
              ...(field.config || {}),
              ...(field.placeholder && { placeholder: field.placeholder }),
            } as Prisma.JsonObject,
          })),
        },
      }),
    };

    // Gerenciar senha separadamente
    if (dto.password === '') {
      // Remove senha
      updateData.password = { delete: true };
    } else if (dto.password) {
      // Adiciona/atualiza senha
      updateData.password = {
        upsert: {
          create: { hash: await bcrypt.hash(dto.password, 10) },
          update: { hash: await bcrypt.hash(dto.password, 10) },
        },
      };
    }

    return this.formsRepository.update(id, updateData);
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId);
    await this.formsRepository.delete(id);
  }

  async clone(id: string, userId: string): Promise<Form> {
    await this.findOne(id, userId);
    return this.formsRepository.clone(id);
  }
}
