import { Injectable } from '@nestjs/common';
import { AnalyticsRepository } from './analytics.repository';
import { parseUserAgent } from '@/common/utils/user-agent.parser';
import { parsePeriod } from '@/common/utils/period.parser';
import { formatTimeSpent } from '@/common/utils/time-formatter';
import { getLocationFromIp } from '@/common/utils/geo.parser';

@Injectable()
export class AnalyticsService {
  constructor(private readonly analyticsRepository: AnalyticsRepository) {}

  async getTemporalData(
    userId: string,
    period: string,
    formId?: string,
  ): Promise<{ data: { date: string; acessos: number; respostas: number }[] }> {
    const days = parsePeriod(period);
    const data = await this.analyticsRepository.getTemporalData(
      userId,
      days,
      formId,
    );

    return { data };
  }

  private calculateDistribution(
    submissions: { userAgent: string | null }[],
    extractor: (ua: string | null) => string,
    minPercentage = 0,
  ): { name: string; value: number; count: number }[] {
    const counts = new Map<string, number>();

    for (const submission of submissions) {
      const key = extractor(submission.userAgent);
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    const total = submissions.length;
    const data: { name: string; value: number; count: number }[] = [];
    let othersCount = 0;

    for (const [name, count] of counts) {
      const percentage = total > 0 ? (count / total) * 100 : 0;
      if (minPercentage > 0 && percentage < minPercentage) {
        othersCount += count;
      } else {
        data.push({
          name,
          value: Number(percentage.toFixed(2)),
          count,
        });
      }
    }

    if (othersCount > 0) {
      data.push({
        name: 'Outros',
        value: Number(((othersCount / total) * 100).toFixed(2)),
        count: othersCount,
      });
    }

    data.sort((a, b) => b.count - a.count);
    return data;
  }

  async getDeviceDistribution(
    userId: string,
    period: string,
    formId?: string,
  ): Promise<{
    data: { name: string; value: number; count: number }[];
    topDevice: string;
  }> {
    const days = parsePeriod(period);
    const submissions = await this.analyticsRepository.getDeviceDistribution(
      userId,
      days,
      formId,
    );

    const data = this.calculateDistribution(
      submissions,
      (ua) => parseUserAgent(ua).device,
    );

    return {
      data,
      topDevice: data[0]?.name || 'unknown',
    };
  }

  async getBrowserDistribution(
    userId: string,
    period: string,
    formId?: string,
  ): Promise<{
    data: { name: string; value: number; count: number }[];
    topBrowser: string;
  }> {
    const days = parsePeriod(period);
    const submissions = await this.analyticsRepository.getDeviceDistribution(
      userId,
      days,
      formId,
    );

    const data = this.calculateDistribution(
      submissions,
      (ua) => parseUserAgent(ua).browser,
      2,
    );

    return {
      data,
      topBrowser: data[0]?.name || 'unknown',
    };
  }

  async getFunnelData(
    userId: string,
    period: string,
    formId?: string,
  ): Promise<{
    data: {
      stage: string;
      count: number;
      percentage: number;
      dropoff: number;
    }[];
    totalViews: number;
    totalSubmissions: number;
    overallConversion: number;
    criticalPoints: string[];
  }> {
    const days = parsePeriod(period);
    const { views, started, completed } =
      await this.analyticsRepository.getFunnelData(userId, days, formId);

    const stages = [
      { stage: 'Visualizaram', count: views },
      { stage: 'Iniciaram', count: started },
      { stage: 'Enviaram', count: completed },
    ];

    const data = stages.map((s, i) => {
      const percentage = views > 0 ? (s.count / views) * 100 : 0;
      const dropoff =
        i > 0 && stages[i - 1].count > 0
          ? ((stages[i - 1].count - s.count) / stages[i - 1].count) * 100
          : 0;

      return {
        stage: s.stage,
        count: s.count,
        percentage: Number(percentage.toFixed(2)),
        dropoff: Number(dropoff.toFixed(2)),
      };
    });

    const criticalPoints: string[] = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i].dropoff > 15) {
        criticalPoints.push(
          `${data[i - 1].stage} → ${data[i].stage}: ${data[i].dropoff}% dropoff`,
        );
      }
    }

    return {
      data,
      totalViews: views,
      totalSubmissions: completed,
      overallConversion:
        views > 0
          ? Math.min(100, Number(((completed / views) * 100).toFixed(2)))
          : 0,
      criticalPoints,
    };
  }

  async getHeatmapData(
    userId: string,
    period: string,
    formId?: string,
  ): Promise<{
    data: { day: string; hours: { hour: number; count: number }[] }[];
    peakDay: string;
    peakHour: number;
  }> {
    const days = parsePeriod(period);
    const rawData = await this.analyticsRepository.getHeatmapData(
      userId,
      days,
      formId,
    );

    const heatmap = new Map<number, Map<number, number>>();
    let maxCount = 0;
    let peakDay = 0;
    let peakHour = 0;

    for (const row of rawData) {
      const count = Number(row.count);
      if (!heatmap.has(row.dow)) {
        heatmap.set(row.dow, new Map());
      }
      heatmap.get(row.dow)!.set(row.hour, count);

      if (count > maxCount) {
        maxCount = count;
        peakDay = row.dow;
        peakHour = row.hour;
      }
    }

    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const data = [];

    for (let d = 0; d < 7; d++) {
      const hours = [];
      for (let h = 0; h < 24; h++) {
        hours.push({
          hour: h,
          count: heatmap.get(d)?.get(h) || 0,
        });
      }
      data.push({ day: dayNames[d], hours });
    }

    return {
      data,
      peakDay: dayNames[peakDay],
      peakHour,
    };
  }

  async getLocationData(
    userId: string,
    period: string,
    formId?: string,
  ): Promise<{
    data: { state: string; acessos: number; respostas: number; taxa: number }[];
    bestConversion: string;
  }> {
    const days = parsePeriod(period);
    const { submissionIps } = await this.analyticsRepository.getLocationData(
      userId,
      days,
      formId,
    );

    const states = await Promise.all(
      submissionIps.map((ip) => getLocationFromIp(ip)),
    );

    const stateCounts = new Map<string, number>();
    for (const state of states) {
      const key = state || 'Desconhecido';
      stateCounts.set(key, (stateCounts.get(key) || 0) + 1);
    }

    const allStates = Array.from(stateCounts.entries())
      .map(([state, count]) => ({
        state,
        acessos: count,
        respostas: count,
        taxa: 100,
      }))
      .sort((a, b) => b.respostas - a.respostas);

    const top10 = allStates.slice(0, 10);
    const others = allStates.slice(10);

    if (others.length > 0) {
      const othersSum = others.reduce((acc, s) => acc + s.respostas, 0);

      top10.push({
        state: 'Outros',
        acessos: othersSum,
        respostas: othersSum,
        taxa: 100,
      });
    }

    const bestConversion = top10.length > 0 ? top10[0].state : 'N/A';

    return {
      data: top10,
      bestConversion,
    };
  }

  async getKPIs(
    userId: string,
    period: string,
    formId?: string,
  ): Promise<{
    growth: { value: number; trend: number; isPositive: boolean };
    conversionRate: { value: number; trend: number; isPositive: boolean };
    averageTime: { value: string; trend: number; isPositive: boolean };
    engagement: {
      value: number;
      trend: number;
      isPositive: boolean;
      description: string;
    };
  }> {
    const days = parsePeriod(period);

    const [current, previous] = await Promise.all([
      this.analyticsRepository.getKPIData(userId, days, formId),
      this.analyticsRepository.getKPIData(userId, days * 2, formId),
    ]);

    const previousResponses = previous.totalResponses - current.totalResponses;
    const previousViews = previous.totalViews - current.totalViews;

    const growthTrend =
      previousResponses > 0
        ? ((current.totalResponses - previousResponses) / previousResponses) *
          100
        : 0;

    const currentConversion =
      current.totalViews > 0
        ? Math.min(100, (current.totalResponses / current.totalViews) * 100)
        : 0;
    const previousConversion =
      previousViews > 0
        ? Math.min(100, (previousResponses / previousViews) * 100)
        : 0;
    const conversionTrend = currentConversion - previousConversion;

    const engagementScore = Math.min(
      100,
      Math.round(
        (currentConversion * 0.4 +
          (current.avgTimeSpent > 0 ? 30 : 0) +
          (current.totalResponses > 0 ? 30 : 0)) *
          1,
      ),
    );

    return {
      growth: {
        value: current.totalResponses,
        trend: Number(growthTrend.toFixed(1)),
        isPositive: growthTrend >= 0,
      },
      conversionRate: {
        value: Number(currentConversion.toFixed(2)),
        trend: Number(conversionTrend.toFixed(1)),
        isPositive: conversionTrend >= 0,
      },
      averageTime: {
        value: formatTimeSpent(current.avgTimeSpent),
        trend: 0,
        isPositive: true,
      },
      engagement: {
        value: engagementScore,
        trend: 0,
        isPositive: true,
        description:
          engagementScore >= 70
            ? 'Excelente'
            : engagementScore >= 40
              ? 'Bom'
              : 'Precisa melhorar',
      },
    };
  }

  async getFormRanking(
    userId: string,
    period: string,
    limit = 10,
  ): Promise<{
    data: Array<{
      rank: number;
      formId: string;
      nome: string;
      acessos: number;
      respostas: number;
      conversao: number;
      tempo: string;
      score: number;
    }>;
    averageConversion: number;
    problematicForms: string[];
  }> {
    const days = parsePeriod(period);
    const forms = await this.analyticsRepository.getFormRanking(
      userId,
      days,
      limit,
    );

    const ranked = forms
      .map((form) => {
        const conversao =
          form.totalViews > 0
            ? Math.min(100, (form.totalResponses / form.totalViews) * 100)
            : 0;
        return { ...form, conversao };
      })
      .sort((a, b) => b.conversao - a.conversao)
      .map((form, index) => ({
        rank: index + 1,
        formId: form.id,
        nome: form.name,
        acessos: form.totalViews,
        respostas: form.totalResponses,
        conversao: Number(form.conversao.toFixed(2)),
        tempo: formatTimeSpent(form.avgTimeSpent, true),
        score: Math.min(5, Math.max(1, Math.round(form.conversao / 20))),
      }));

    const avgConversion =
      ranked.length > 0
        ? ranked.reduce((sum, f) => sum + f.conversao, 0) / ranked.length
        : 0;

    const problematic = ranked
      .filter((f) => f.conversao < avgConversion - 10)
      .map((f) => f.nome);

    return {
      data: ranked,
      averageConversion: Number(avgConversion.toFixed(2)),
      problematicForms: problematic,
    };
  }
}
