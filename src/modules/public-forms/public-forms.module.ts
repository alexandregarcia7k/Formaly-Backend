import { Module } from '@nestjs/common';
import { PublicFormsController } from './public-forms.controller';
import { PublicFormsService } from './public-forms.service';
import { PublicFormsRepository } from './public-forms.repository';
import { DashboardModule } from '../dashboard/dashboard.module';

@Module({
  imports: [DashboardModule],
  controllers: [PublicFormsController],
  providers: [PublicFormsService, PublicFormsRepository],
})
export class PublicFormsModule {}
