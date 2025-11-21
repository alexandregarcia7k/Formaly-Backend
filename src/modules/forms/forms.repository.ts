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
    // Se buscar em responses, usar query raw
    if (
      filters.search &&
      (filters.searchIn === 'responses' || filters.searchIn === 'all')
    ) {
      return this.searchInResponses(userId, filters, skip, take);
    }

    // Busca normal em form
    const where = this.buildWhereClause(userId, filters);
    const orderBy: Prisma.FormOrderByWithRelationInput = {
      [filters.sortBy || 'createdAt']: filters.sortOrder || 'desc',
    };

    return this.prisma.form.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        password: true,
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

    const forms = await this.prisma.$queryRaw<Form[]>`
      SELECT DISTINCT f.*
      FROM forms f
      WHERE f.user_id = ${userId}::uuid
        ${filters.status && filters.status !== 'all' ? Prisma.sql`AND f.status = ${filters.status.toUpperCase()}` : Prisma.empty}
        AND (${searchCondition})
      ${orderByClause}
      LIMIT ${take}
      OFFSET ${skip}
    `;

    return forms;
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

    const result = await this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(DISTINCT f.id) as count
      FROM forms f
      WHERE f.user_id = ${userId}::uuid
        ${filters.status && filters.status !== 'all' ? Prisma.sql`AND f.status = ${filters.status.toUpperCase()}` : Prisma.empty}
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

  async clone(formId: string): Promise<Form> {
    const original = await this.prisma.form.findUnique({
      where: { id: formId },
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

    return this.prisma.form.create({
      data: cloneData,
      include: {
        fields: true,
        password: true,
      },
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

    const column = validSortColumns[sortBy] || 'created_at';
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
}
