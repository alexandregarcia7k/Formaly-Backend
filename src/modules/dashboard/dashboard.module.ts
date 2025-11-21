import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardRepository } from './dashboard.repository';
import { ActivityRepository } from './activity.repository';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, DashboardRepository, ActivityRepository],
  exports: [DashboardService, ActivityRepository],
})
export class DashboardModule {}
