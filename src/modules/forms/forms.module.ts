import { Module } from '@nestjs/common';
import { FormsController } from './forms.controller';
import { FormsService } from './forms.service';
import { FormsRepository } from './forms.repository';

@Module({
  controllers: [FormsController],
  providers: [FormsService, FormsRepository],
  exports: [FormsService],
})
export class FormsModule {}
