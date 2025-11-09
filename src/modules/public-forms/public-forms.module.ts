import { Module } from '@nestjs/common';
import { PublicFormsController } from './public-forms.controller';
import { PublicFormsService } from './public-forms.service';

@Module({
  controllers: [PublicFormsController],
  providers: [PublicFormsService],
})
export class PublicFormsModule {}
