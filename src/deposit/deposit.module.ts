// src/deposit/deposit.module.ts
import { Module } from '@nestjs/common';
import { DepositService } from './deposit.service';
import { DepositController } from './deposit.controller';
import { SupabaseModule } from '../supabase/supabase.module'; // 👈 IMPORTAÇÃO AQUI!

@Module({
  imports: [SupabaseModule], // 👈 IMPORTAR AQUI!
  controllers: [DepositController],
  providers: [DepositService],
})
export class DepositModule {}
