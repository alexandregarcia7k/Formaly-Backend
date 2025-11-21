import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parseUserAgent } from '@/common/utils/user-agent.parser';

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: string): Promise<{
    totalForms: number;
    totalResponses: number;
    totalViews: number;
  }> {
    const result = await this.prisma.$queryRaw<
      Array<{
        total_forms: bigint;
        total_responses: bigint;
        total_views: bigint;
      }>
    >`
      SELECT 
        COUNT(f.id)::int as total_forms,
        COALESCE(SUM(f.total_responses), 0)::int as total_responses,
        COALESCE(SUM(f.total_views), 0)::int as total_views
      FROM forms f
      WHERE f.user_id = ${userId}
    `;

    const stats = result[0] || {
      total_forms: 0n,
      total_responses: 0n,
      total_views: 0n,
    };

    return {
      totalForms: Number(stats.total_forms),
      totalResponses: Number(stats.total_responses),
      totalViews: Number(stats.total_views),
    };
  }

  async findLatestResponses(userId: string, limit: number) {
    const submissions = await this.prisma.$queryRaw<
      Array<{
        id: string;
        form_id: string;
        form_name: string;
        created_at: Date;
        time_spent: number | null;
        user_agent: string | null;
      }>
    >`
      SELECT 
        fs.id,
        fs.form_id,
        f.name as form_name,
        fs.created_at,
        fs.time_spent,
        fs.user_agent
      FROM form_submissions fs
      INNER JOIN forms f ON fs.form_id = f.id
      WHERE f.user_id = ${userId}
      ORDER BY fs.created_at DESC
      LIMIT ${limit}
    `;

    return submissions.map((submission) => {
      const { device, browser } = parseUserAgent(submission.user_agent);
      return {
        id: submission.id,
        formId: submission.form_id,
        formTitle: submission.form_name,
        submittedAt: submission.created_at,
        timeSpent: submission.time_spent,
        device,
        browser,
      };
    });
  }

  async countTotalResponses(userId: string): Promise<number> {
    const result = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::int as count
      FROM form_submissions fs
      INNER JOIN forms f ON fs.form_id = f.id
      WHERE f.user_id = ${userId}
    `;
    return Number(result[0]?.count || 0);
  }

  async getResponsesOverTime(userId: string, days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const responses = await this.prisma.$queryRaw<
      Array<{ date: Date; count: bigint }>
    >`
      SELECT DATE(fs.created_at) as date, COUNT(*)::int as count
      FROM form_submissions fs
      INNER JOIN forms f ON fs.form_id = f.id
      WHERE f.user_id = ${userId}
        AND fs.created_at >= ${startDate}
      GROUP BY DATE(fs.created_at)
      ORDER BY date ASC
    `;

    const dataMap = new Map<string, number>();
    responses.forEach((r) => {
      const dateStr = new Date(r.date).toISOString().split('T')[0];
      dataMap.set(dateStr, Number(r.count));
    });

    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        count: dataMap.get(dateStr) || 0,
      });
    }

    return { data: result };
  }
}
