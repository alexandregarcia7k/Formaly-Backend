import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Form, FormStatus, Prisma } from '@prisma/client';
import type { FindAllFiltersInput } from './dto/find-all-filters.dto';

@Injectable()
export class FormsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.FormCreateInput): Promise<Form> {
    return this.prisma.form.create({
      data,
      include: {
        fields: true,
        password: true,
      },
    });
  }

  async findById(id: string): Promise<Form | null> {
    return this.prisma.form.findUnique({
      where: { id },
      include: {
        fields: true,
        password: true,
      },
    });
  }

  async findByIdAndUserId(id: string, userId: string): Promise<Form | null> {
    return this.prisma.form.findFirst({
      where: { id, userId },
      include: {
        fields: true,
        password: true,
      },
    });
  }

  async findByNameAndUserId(
    name: string,
    userId: string,
  ): Promise<Form | null> {
    return this.prisma.form.findFirst({
      where: { name, userId },
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
        password: true,
      },
    });
  }

  async findByUserIdWithFilters(
    userId: string,
    filters: FindAllFiltersInput,
    skip: number,
    take: number,
  ): Promise<Form[]> {
    if (
      filters.search &&
      (filters.searchIn === 'responses' || filters.searchIn === 'all')
    ) {
      return this.searchInResponses(userId, filters, skip, take);
    }

    const where = this.buildWhereClause(userId, filters);
    const orderBy: Prisma.FormOrderByWithRelationInput = {
      [filters.sortBy || 'createdAt']: filters.sortOrder || 'desc',
    };

    return this.prisma.form.findMany({
      where,
      skip,
      take,
      orderBy,
      select: {
        id: true,
        userId: true,
        name: true,
        description: true,
        status: true,
        totalResponses: true,
        totalViews: true,
        lastResponseAt: true,
        maxResponses: true,
        expiresAt: true,
        allowMultipleSubmissions: true,
        createdAt: true,
        updatedAt: true,
        password: {
          select: {
            hash: true,
          },
        },
      },
    });
  }

  private async searchInResponses(
    userId: string,
    filters: FindAllFiltersInput,
    skip: number,
    take: number,
  ): Promise<Form[]> {
    const searchQuery = this.sanitizeSearchQuery(filters.search!.trim());
    const orderByClause = this.buildOrderByClause(
      filters.sortBy || 'createdAt',
      filters.sortOrder || 'desc',
    );
    const searchCondition = this.buildSearchCondition(
      filters.searchIn,
      searchQuery,
    );

    const validStatus = this.validateStatus(filters.status);

    const forms = await this.prisma.$queryRaw<Form[]>`
      SELECT DISTINCT f.*
      FROM forms f
      WHERE f.user_id = ${userId}::uuid
        ${validStatus ? Prisma.sql`AND f.status = ${Prisma.raw(validStatus)}` : Prisma.empty}
        AND (${searchCondition})
      ${orderByClause}
      LIMIT ${take}
      OFFSET ${skip}
    `;

    return forms;
  }

  private validateStatus(status?: string): string | null {
    if (!status || status === 'all') return null;
    const validStatuses = ['ACTIVE', 'INACTIVE'];
    const upperStatus = status.toUpperCase();
    if (!validStatuses.includes(upperStatus)) {
      throw new Error(`Invalid status: ${status}`);
    }
    return upperStatus;
  }

  async countByUserId(userId: string): Promise<number> {
    return this.prisma.form.count({
      where: { userId },
    });
  }

  async countByUserIdWithFilters(
    userId: string,
    filters: FindAllFiltersInput,
  ): Promise<number> {
    // Se buscar em responses, usar query raw
    if (
      filters.search &&
      (filters.searchIn === 'responses' || filters.searchIn === 'all')
    ) {
      return this.countSearchInResponses(userId, filters);
    }

    const where = this.buildWhereClause(userId, filters);
    return this.prisma.form.count({ where });
  }

  private async countSearchInResponses(
    userId: string,
    filters: FindAllFiltersInput,
  ): Promise<number> {
    const searchQuery = this.sanitizeSearchQuery(filters.search!.trim());
    const searchCondition = this.buildSearchCondition(
      filters.searchIn,
      searchQuery,
    );

    const validStatus = this.validateStatus(filters.status);

    const result = await this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(DISTINCT f.id) as count
      FROM forms f
      WHERE f.user_id = ${userId}::uuid
        ${validStatus ? Prisma.sql`AND f.status = ${Prisma.raw(validStatus)}` : Prisma.empty}
        AND (${searchCondition})
    `;

    return Number(result[0].count);
  }

  async update(id: string, data: Prisma.FormUpdateInput): Promise<Form> {
    return this.prisma.form.update({
      where: { id },
      data,
      include: {
        fields: true,
        password: true,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.form.delete({
      where: { id },
    });
  }

  async updateWithTransaction(
    id: string,
    data: Prisma.FormUpdateInput,
    userId: string,
    oldStatus: string,
    newStatus?: string,
  ): Promise<Form> {
    return this.prisma.$transaction(async (tx) => {
      const form = await tx.form.update({
        where: { id },
        data,
        include: {
          fields: true,
          password: true,
        },
      });

      const statusChanged = newStatus && newStatus !== oldStatus;
      await tx.activity.create({
        data: {
          type: statusChanged ? 'form_status_changed' : 'form_updated',
          formId: form.id,
          message: statusChanged
            ? `Formulário "${form.name}" ${newStatus === 'ACTIVE' ? 'ativado' : 'desativado'}`
            : `Formulário "${form.name}" atualizado`,
          userId,
        },
      });

      return form;
    });
  }

  async deleteWithTransaction(
    id: string,
    userId: string,
    formName: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.form.delete({
        where: { id },
      });

      await tx.activity.create({
        data: {
          type: 'form_deleted',
          message: `Formulário "${formName}" deletado`,
          userId,
        },
      });
    });
  }

  async cloneWithValidation(formId: string, userId: string): Promise<Form> {
    return this.prisma.$transaction(async (tx) => {
      const original = await tx.form.findFirst({
        where: { id: formId, userId },
        include: { fields: true, password: true },
      });

      if (!original) {
        throw new Error('Form not found');
      }

      const cloneData: Prisma.FormCreateInput = {
        user: { connect: { id: original.userId } },
        name: `${original.name} (cópia)`,
        description: original.description,
        status: original.status,
        maxResponses: original.maxResponses,
        expiresAt: original.expiresAt,
        allowMultipleSubmissions: original.allowMultipleSubmissions,
        fields: {
          create: original.fields.map((field) => ({
            type: field.type,
            label: field.label,
            name: field.name,
            required: field.required,
            config: field.config as Prisma.JsonObject,
          })),
        },
      };

      if (original.password) {
        cloneData.password = {
          create: { hash: original.password.hash },
        };
      }

      const form = await tx.form.create({
        data: cloneData,
        include: {
          fields: true,
          password: true,
        },
      });

      await tx.activity.create({
        data: {
          type: 'form_cloned',
          formId: form.id,
          message: `Formulário "${form.name}" clonado`,
          userId,
        },
      });

      return form;
    });
  }

  private buildWhereClause(
    userId: string,
    filters: FindAllFiltersInput,
  ): Prisma.FormWhereInput {
    const where: Prisma.FormWhereInput = {
      userId,
      ...(filters.status &&
        filters.status !== 'all' && {
          status: filters.status.toUpperCase() as FormStatus,
        }),
    };

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private sanitizeSearchQuery(query: string): string {
    return query.replace(/[&|!:()]/g, ' ').trim();
  }

  private buildOrderByClause(sortBy: string, sortOrder: string): Prisma.Sql {
    const validSortColumns: Record<string, string> = {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      name: 'name',
      totalResponses: 'total_responses',
    };

    const column = validSortColumns[sortBy];
    if (!column) {
      throw new Error(`Invalid sortBy: ${sortBy}`);
    }

    if (sortOrder !== 'asc' && sortOrder !== 'desc') {
      throw new Error(`Invalid sortOrder: ${sortOrder}`);
    }

    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

    return Prisma.sql`ORDER BY f.${Prisma.raw(column)} ${Prisma.raw(order)}`;
  }

  private buildSearchCondition(
    searchIn: string,
    searchQuery: string,
  ): Prisma.Sql {
    if (searchIn === 'all') {
      return Prisma.sql`
        f.name ILIKE ${'%' + searchQuery + '%'}
        OR f.description ILIKE ${'%' + searchQuery + '%'}
        OR EXISTS (
          SELECT 1
          FROM form_submissions fs
          JOIN form_values fv ON fv.submission_id = fs.id
          WHERE fs.form_id = f.id
            AND fv.search_vector @@ to_tsquery('portuguese', ${searchQuery})
        )
      `;
    }

    return Prisma.sql`
      EXISTS (
        SELECT 1
        FROM form_submissions fs
        JOIN form_values fv ON fv.submission_id = fs.id
        WHERE fs.form_id = f.id
          AND fv.search_vector @@ to_tsquery('portuguese', ${searchQuery})
      )
    `;
  }

  async findSubmissions(formId: string, skip: number, take: number) {
    return this.prisma.formSubmission.findMany({
      where: { formId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        formId: true,
        ipAddress: true,
        userAgent: true,
        startedAt: true,
        completedAt: true,
        timeSpent: true,
        createdAt: true,
        values: {
          select: {
            fieldId: true,
            type: true,
            value: true,
          },
        },
      },
    });
  }

  async countSubmissions(formId: string): Promise<number> {
    return this.prisma.formSubmission.count({
      where: { formId },
    });
  }
}
