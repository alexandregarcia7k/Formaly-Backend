import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { getStartDate, fillDateRange } from '@/common/utils/date-range.util';

@Injectable()
export class AnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getTemporalData(
    userId: string,
    days: number,
    formId?: string,
  ): Promise<{ date: string; acessos: number; respostas: number }[]> {
    const startDate = getStartDate(days);

    const [viewsData, submissionsData] = await Promise.all([
      this.prisma.$queryRaw<{ date: Date; count: bigint }[]>`
        SELECT DATE(fv."createdAt") as date, COUNT(*)::bigint as count
        FROM "FormView" fv
        INNER JOIN "Form" f ON fv."formId" = f.id
        WHERE f."userId" = ${userId}
          AND fv."createdAt" >= ${startDate}
          ${formId ? Prisma.sql`AND f.id = ${formId}` : Prisma.empty}
        GROUP BY DATE(fv."createdAt")
        ORDER BY date ASC
      `,
      this.prisma.$queryRaw<{ date: Date; count: bigint }[]>`
        SELECT DATE(fs."createdAt") as date, COUNT(*)::bigint as count
        FROM "FormSubmission" fs
        INNER JOIN "Form" f ON fs."formId" = f.id
        WHERE f."userId" = ${userId}
          AND fs."createdAt" >= ${startDate}
          ${formId ? Prisma.sql`AND f.id = ${formId}` : Prisma.empty}
        GROUP BY DATE(fs."createdAt")
        ORDER BY date ASC
      `,
    ]);

    const viewsMap = new Map<string, number>();
    const submissionsMap = new Map<string, number>();

    for (const row of viewsData) {
      const dateKey = row.date.toISOString().substring(0, 10);
      viewsMap.set(dateKey, Number(row.count));
    }

    for (const row of submissionsData) {
      const dateKey = row.date.toISOString().substring(0, 10);
      submissionsMap.set(dateKey, Number(row.count));
    }

    const viewsRange = fillDateRange(startDate, new Date(), viewsMap);

    return viewsRange.map((item) => ({
      date: item.date,
      acessos: item.count,
      respostas: submissionsMap.get(item.date) || 0,
    }));
  }

  async getDeviceDistribution(
    userId: string,
    days: number,
    formId?: string,
  ): Promise<{ userAgent: string | null }[]> {
    const startDate = getStartDate(days);

    return this.prisma.formSubmission.findMany({
      where: {
        form: {
          userId,
          ...(formId ? { id: formId } : {}),
        },
        createdAt: { gte: startDate },
        userAgent: { not: null },
      },
      select: { userAgent: true },
    });
  }

  async getFunnelData(
    userId: string,
    days: number,
    formId?: string,
  ): Promise<{ views: number; started: number; completed: number }> {
    const startDate = getStartDate(days);

    const [views, started, completed] = await Promise.all([
      this.prisma.formView.count({
        where: {
          form: {
            userId,
            ...(formId ? { id: formId } : {}),
          },
          createdAt: { gte: startDate },
        },
      }),
      this.prisma.formSubmission.count({
        where: {
          form: {
            userId,
            ...(formId ? { id: formId } : {}),
          },
          createdAt: { gte: startDate },
          timeSpent: { gt: 0 },
        },
      }),
      this.prisma.formSubmission.count({
        where: {
          form: {
            userId,
            ...(formId ? { id: formId } : {}),
          },
          createdAt: { gte: startDate },
          completedAt: { not: null },
        },
      }),
    ]);

    return { views, started, completed };
  }

  async getHeatmapData(
    userId: string,
    days: number,
    formId?: string,
  ): Promise<{ dow: number; hour: number; count: bigint }[]> {
    const startDate = getStartDate(days);

    return this.prisma.$queryRaw<
      { dow: number; hour: number; count: bigint }[]
    >`
      SELECT 
        EXTRACT(DOW FROM fs."createdAt")::int as dow,
        EXTRACT(HOUR FROM fs."createdAt")::int as hour,
        COUNT(*)::bigint as count
      FROM "FormSubmission" fs
      INNER JOIN "Form" f ON fs."formId" = f.id
      WHERE f."userId" = ${userId}
        AND fs."createdAt" >= ${startDate}
        ${formId ? Prisma.sql`AND f.id = ${formId}` : Prisma.empty}
      GROUP BY dow, hour
    `;
  }

  async getLocationData(
    userId: string,
    days: number,
    formId?: string,
  ): Promise<{ submissionIps: string[] }> {
    const startDate = getStartDate(days);

    const submissions = await this.prisma.formSubmission.findMany({
      where: {
        form: {
          userId,
          ...(formId ? { id: formId } : {}),
        },
        createdAt: { gte: startDate },
        ipAddress: { not: null },
      },
      select: { ipAddress: true },
    });

    return {
      submissionIps: submissions.map((s) => s.ipAddress!),
    };
  }

  async getKPIData(
    userId: string,
    days: number,
    formId?: string,
  ): Promise<{
    totalResponses: number;
    totalViews: number;
    avgTimeSpent: number;
    totalForms: number;
  }> {
    const startDate = getStartDate(days);

    const [responses, views, avgTime, forms] = await Promise.all([
      this.prisma.formSubmission.count({
        where: {
          form: { userId, ...(formId ? { id: formId } : {}) },
          createdAt: { gte: startDate },
        },
      }),
      this.prisma.formView.count({
        where: {
          form: { userId, ...(formId ? { id: formId } : {}) },
          createdAt: { gte: startDate },
        },
      }),
      this.prisma.formSubmission.aggregate({
        where: {
          form: { userId, ...(formId ? { id: formId } : {}) },
          createdAt: { gte: startDate },
          timeSpent: { not: null },
        },
        _avg: { timeSpent: true },
      }),
      formId
        ? Promise.resolve(1)
        : this.prisma.form.count({ where: { userId } }),
    ]);

    return {
      totalResponses: responses,
      totalViews: views,
      avgTimeSpent: avgTime._avg.timeSpent || 0,
      totalForms: forms,
    };
  }

  async getFormRanking(
    userId: string,
    days: number,
    limit: number,
  ): Promise<
    Array<{
      id: string;
      name: string;
      totalResponses: number;
      totalViews: number;
      avgTimeSpent: number;
    }>
  > {
    const startDate = getStartDate(days);

    const result = await this.prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        total_responses: number;
        total_views: number;
        avg_time_spent: number | null;
      }>
    >`
      SELECT 
        f.id,
        f.name,
        f.total_responses,
        f.total_views,
        COALESCE(AVG(fs.time_spent), 0)::float as avg_time_spent
      FROM forms f
      LEFT JOIN form_submissions fs ON fs.form_id = f.id 
        AND fs.created_at >= ${startDate}
        AND fs.time_spent IS NOT NULL
      WHERE f.user_id = ${userId}
      GROUP BY f.id, f.name, f.total_responses, f.total_views
      ORDER BY f.total_responses DESC
      LIMIT ${limit}
    `;

    return result.map((row) => ({
      id: row.id,
      name: row.name,
      totalResponses: row.total_responses,
      totalViews: row.total_views,
      avgTimeSpent: row.avg_time_spent || 0,
    }));
  }
}
