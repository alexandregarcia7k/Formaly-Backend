import { Module } from '@nestjs/common';
import { FormsController } from './forms.controller';
import { FormsService } from './forms.service';
import { FormsRepository } from './forms.repository';
import { CacheService } from '@/common/services/cache.service';
import { DashboardModule } from '../dashboard/dashboard.module';

@Module({
  imports: [DashboardModule],
  controllers: [FormsController],
  providers: [FormsService, FormsRepository, CacheService],
  exports: [FormsService],
})
export class FormsModule {}
