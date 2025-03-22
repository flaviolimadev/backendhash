// src/deposit/deposit.module.ts
import { Module } from '@nestjs/common';
import { DepositService } from './deposit.service';
import { DepositController } from './deposit.controller';
import { SupabaseModule } from '../supabase/supabase.module'; // 👈 IMPORTAÇÃO AQUI!
import { DepositCronService } from './deposit.cron';

@Module({
  imports: [SupabaseModule], // 👈 IMPORTAR AQUI!
  controllers: [DepositController],
  providers: [DepositService, DepositCronService],
})
export class DepositModule {}
