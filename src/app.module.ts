import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { FormsModule } from './modules/forms/forms.module';
import { PublicFormsModule } from './modules/public-forms/public-forms.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    FormsModule,
    PublicFormsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
