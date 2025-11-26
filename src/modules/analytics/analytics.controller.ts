import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { PeriodQueryDto } from './dto/period-query.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { User } from '@prisma/client';

@ApiTags('analytics')
@Controller('api/analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('temporal')
  @ApiOperation({
    summary: 'Get temporal data (views and submissions over time)',
  })
  @ApiResponse({ status: 200, description: 'Temporal data returned' })
  async getTemporalData(
    @Query() query: PeriodQueryDto,
    @CurrentUser() user: User,
  ): Promise<{ data: { date: string; acessos: number; respostas: number }[] }> {
    return this.analyticsService.getTemporalData(
      user.id,
      query.period || '30d',
      query.formId,
    );
  }

  @Get('devices')
  @ApiOperation({ summary: 'Get device distribution' })
  @ApiResponse({ status: 200, description: 'Device distribution returned' })
  async getDeviceDistribution(
    @Query() query: PeriodQueryDto,
    @CurrentUser() user: User,
  ): Promise<{
    data: { name: string; value: number; count: number }[];
    topDevice: string;
  }> {
    return this.analyticsService.getDeviceDistribution(
      user.id,
      query.period || '30d',
      query.formId,
    );
  }

  @Get('browsers')
  @ApiOperation({ summary: 'Get browser distribution' })
  @ApiResponse({ status: 200, description: 'Browser distribution returned' })
  async getBrowserDistribution(
    @Query() query: PeriodQueryDto,
    @CurrentUser() user: User,
  ): Promise<{
    data: { name: string; value: number; count: number }[];
    topBrowser: string;
  }> {
    return this.analyticsService.getBrowserDistribution(
      user.id,
      query.period || '30d',
      query.formId,
    );
  }

  @Get('funnel')
  @ApiOperation({ summary: 'Get conversion funnel data' })
  @ApiResponse({ status: 200, description: 'Funnel data returned' })
  async getFunnelData(
    @Query() query: PeriodQueryDto,
    @CurrentUser() user: User,
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
    return this.analyticsService.getFunnelData(
      user.id,
      query.period || '30d',
      query.formId,
    );
  }

  @Get('heatmap')
  @ApiOperation({ summary: 'Get activity heatmap by day and hour' })
  @ApiResponse({ status: 200, description: 'Heatmap data returned' })
  async getHeatmapData(
    @Query() query: PeriodQueryDto,
    @CurrentUser() user: User,
  ): Promise<{
    data: { day: string; hours: { hour: number; count: number }[] }[];
    peakDay: string;
    peakHour: number;
  }> {
    return this.analyticsService.getHeatmapData(
      user.id,
      query.period || '30d',
      query.formId,
    );
  }

  @Get('location')
  @ApiOperation({ summary: 'Get geographic distribution' })
  @ApiResponse({ status: 200, description: 'Location data returned' })
  async getLocationData(
    @Query() query: PeriodQueryDto,
    @CurrentUser() user: User,
  ): Promise<{
    data: { state: string; acessos: number; respostas: number; taxa: number }[];
    bestConversion: string;
  }> {
    return this.analyticsService.getLocationData(
      user.id,
      query.period || '30d',
      query.formId,
    );
  }

  @Get('kpis')
  @ApiOperation({ summary: 'Get key performance indicators' })
  @ApiResponse({ status: 200, description: 'KPIs returned' })
  async getKPIs(
    @Query() query: PeriodQueryDto,
    @CurrentUser() user: User,
  ): Promise<{
    growth: { value: number; trend: number; isPositive: boolean };
    conversionRate: { value: number; trend: number; isPositive: boolean };
    averageTime: { value: string; trend: number; isPositive: boolean };
    engagement: { value: number; description: string };
  }> {
    return this.analyticsService.getKPIs(
      user.id,
      query.period || '30d',
      query.formId,
    );
  }

  @Get('ranking')
  @ApiOperation({ summary: 'Get forms ranking by conversion' })
  @ApiResponse({ status: 200, description: 'Ranking returned' })
  async getFormRanking(
    @Query() query: PeriodQueryDto,
    @CurrentUser() user: User,
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
    return this.analyticsService.getFormRanking(user.id, query.period || '30d');
  }
}
