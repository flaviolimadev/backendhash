// src/bonus/bonus.cron.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class BonusCronService {
  private readonly logger = new Logger(BonusCronService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  // Mapeamento de percentual por nível
  private percentByLevel = [10, 4, 3, 2, 1, 1, 1, 1, 1, 1];

  @Cron('*/60 * * * * *')
  async processBonuses() {
    this.logger.log('🔁 Verificando depósitos para bonificação...');

    const supabase = this.supabaseService.getClient();

    const { data: deposits, error } = await supabase
      .from('depositos')
      .select('*')
      .eq('status', 1);

    if (error) {
      this.logger.error('Erro ao buscar depósitos confirmados:', error);
      return;
    }

    if (!deposits || deposits.length === 0) {
      this.logger.log('Nenhum depósito a bonificar no momento.');
      return;
    }

    for (const deposit of deposits) {
      try {
        const depositValue = deposit.value;
        let currentProfileId = deposit.profile_id;
        let currentLevel = 0;

        while (currentLevel < 10) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, referred_by, balance')
            .eq('id', currentProfileId)
            .maybeSingle();

          if (profileError || !profileData || !profileData.referred_by) {
            break;
          }

          const referrerId = profileData.referred_by;
          const percent = this.percentByLevel[currentLevel];
          const bonusValue = Math.floor(depositValue * (percent / 100));

          const { error: updateError } = await supabase.rpc('increment_balance', {
            user_id: referrerId,
            amount: bonusValue,
          });

          if (updateError) {
            this.logger.error(`Erro ao atualizar saldo do usuário ${referrerId}:`, updateError);
          } else {
            await supabase.from('extrato').insert({
              profile_id: referrerId,
              ciclo_id: null,
              type: currentLevel === 0 ? 2 : 3,
              value: bonusValue,
              status: 1,
            });

            this.logger.log(`💰 Bônus de R$${bonusValue / 100} atribuído a ${referrerId} (nível ${currentLevel + 1})`);
          }

          currentProfileId = referrerId;
          currentLevel++;
        }

        const { error: statusUpdateError } = await supabase
          .from('depositos')
          .update({ status: 2 })
          .eq('id', deposit.id);

        if (statusUpdateError) {
          this.logger.error(`Erro ao atualizar status do depósito ${deposit.id}:`, statusUpdateError);
        } else {
          this.logger.log(`✅ Bonificações processadas para depósito ${deposit.id}`);
        }
      } catch (err) {
        this.logger.error(`Erro geral ao processar depósito ${deposit.id}:`, err);
      }
    }
  }
}
