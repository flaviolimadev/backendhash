// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { UserModule } from './user/user.module';
import { DepositModule } from './deposit/deposit.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BonusModule } from './bonus/bonus.module';
import { ReferralsModule } from './referrals/referrals.module';
import { SaquesModule } from './saques/saques.module';
import { CronService } from './cron/cron.service';
import { CronModule } from './cron/cron.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SupabaseModule,
    UserModule,
    DepositModule,
    ScheduleModule.forRoot(),
    BonusModule,
    ReferralsModule,
    SaquesModule,
    CronModule
  ],
  providers: [CronService],
})
export class AppModule {}
