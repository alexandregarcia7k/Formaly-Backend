import { Injectable } from '@nestjs/common';
import { DashboardRepository } from './dashboard.repository';
import { ActivityRepository } from './activity.repository';

@Injectable()
export class DashboardService {
  constructor(
    private readonly repository: DashboardRepository,
    private readonly activityRepository: ActivityRepository,
  ) {}

  async getStats(userId: string) {
    const { totalForms, totalResponses, totalViews } =
      await this.repository.getStats(userId);

    const averageCompletionRate =
      totalViews > 0 ? (totalResponses / totalViews) * 100 : 0;

    return {
      totalForms,
      totalResponses,
      totalViews,
      averageCompletionRate: Math.round(averageCompletionRate * 10) / 10,
    };
  }

  async getLatestResponses(userId: string, limit = 10) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const [data, total] = await Promise.all([
      this.repository.findLatestResponses(userId, safeLimit),
      this.repository.countTotalResponses(userId),
    ]);

    return { data, total };
  }

  async getResponsesOverTime(userId: string, period: string) {
    const days = this.parsePeriod(period);
    return this.repository.getResponsesOverTime(userId, days);
  }

  async getActivities(userId: string, limit = 5) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const [data, total] = await Promise.all([
      this.activityRepository.findLatest(userId, safeLimit),
      this.activityRepository.count(userId),
    ]);

    return { data, total };
  }

  private parsePeriod(period: string): number {
    const map: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
    };
    return map[period] || 30;
  }
}
