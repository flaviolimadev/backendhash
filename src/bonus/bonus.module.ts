import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { BonusCronService } from './bonus.cron';

@Module({
  imports: [SupabaseModule],
  providers: [BonusCronService],
})
export class BonusModule {}
