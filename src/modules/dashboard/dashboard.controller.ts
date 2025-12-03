import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import type { User } from '@prisma/client';

@ApiTags('dashboard')
@Controller('api/dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Obter estatísticas gerais do dashboard' })
  @ApiResponse({ status: 200, description: 'Estatísticas retornadas' })
  async getStats(@CurrentUser() user: User) {
    return this.dashboardService.getStats(user.id);
  }

  @Get('latest-responses')
  @ApiOperation({ summary: 'Obter últimas respostas' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Respostas retornadas' })
  async getLatestResponses(
    @CurrentUser() user: User,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.dashboardService.getLatestResponses(user.id, limit || 10);
  }

  @Get('responses-over-time')
  @ApiOperation({ summary: 'Obter respostas ao longo do tempo' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['7d', '30d', '90d', '1y'],
  })
  @ApiResponse({ status: 200, description: 'Dados temporais retornados' })
  async getResponsesOverTime(
    @CurrentUser() user: User,
    @Query('period') period?: string,
  ) {
    return this.dashboardService.getResponsesOverTime(user.id, period || '30d');
  }

  @Get('activities')
  @ApiOperation({ summary: 'Obter atividades recentes' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Atividades retornadas' })
  async getActivities(
    @CurrentUser() user: User,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.dashboardService.getActivities(user.id, limit || 5);
  }
}
