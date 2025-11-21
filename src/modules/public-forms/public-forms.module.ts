import { Module } from '@nestjs/common';
import { PublicFormsController } from './public-forms.controller';
import { PublicFormsService } from './public-forms.service';
import { PublicFormsRepository } from './public-forms.repository';
import { CacheService } from '@/common/services/cache.service';
import { DashboardModule } from '../dashboard/dashboard.module';

@Module({
  imports: [DashboardModule],
  controllers: [PublicFormsController],
  providers: [PublicFormsService, PublicFormsRepository, CacheService],
})
export class PublicFormsModule {}
