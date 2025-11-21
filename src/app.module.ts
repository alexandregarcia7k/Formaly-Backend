import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { FormsModule } from './modules/forms/forms.module';
import { PublicFormsModule } from './modules/public-forms/public-forms.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { HealthModule } from './modules/health/health.module';
import { AppCacheModule } from './common/cache/cache.module';
import { AppThrottlerModule } from './common/throttler/throttler.module';

@Module({
  imports: [
    AppCacheModule,
    AppThrottlerModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    FormsModule,
    PublicFormsModule,
    DashboardModule,
    HealthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
