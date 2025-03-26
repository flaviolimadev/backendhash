// src/deposit/verify-cycles.cron.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class VerifyMissingCyclesCron {
  private readonly logger = new Logger(VerifyMissingCyclesCron.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  // Executa a cada 30 segundos
  @Cron('*/30 * * * * *')
  async checkDepositsWithoutCycles() {
    this.logger.log('🔍 Verificando depósitos sem ciclo...');

    const supabase = this.supabaseService.getClient();

    // Busca depósitos com status 1 ou 2
    const { data: deposits, error } = await supabase
      .from('depositos')
      .select('*')
      .in('status', [1, 2]);

    if (error) {
      this.logger.error('Erro ao buscar depósitos:', error);
      return;
    }

    for (const deposit of deposits) {
      try {
        // Verifica se já existe ciclo vinculado a este profile com o mesmo valor
        const { data: existingCycle, error: cycleError } = await supabase
          .from('ciclos')
          .select('id')
          .eq('profile_id', deposit.profile_id)
          .eq('value', deposit.value)
          .limit(1)
          .maybeSingle();

        if (cycleError) {
          this.logger.error(`Erro ao verificar ciclo do depósito ${deposit.id}:`, cycleError);
          continue;
        }

        if (!existingCycle) {
          // Cria o ciclo
          const { data: createdCycle, error: insertError } = await supabase
            .from('ciclos')
            .insert([
              {
                profile_id: deposit.profile_id,
                nivel: 1,
                value: deposit.value,
                status: 1,
              },
            ])
            .select()
            .single();

          if (insertError) {
            this.logger.error(`Erro ao criar ciclo para depósito ${deposit.id}:`, insertError);
            continue;
          }

          // Cria registro no extrato
          await supabase.from('extrato').insert([
            {
              profile_id: deposit.profile_id,
              ciclo_id: createdCycle.id,
              type: 0,
              value: deposit.value,
              status: 1,
            },
          ]);

          this.logger.log(`✅ Ciclo criado para depósito ${deposit.id} e registrado no extrato.`);
        } else {
          this.logger.log(`✔️ Depósito ${deposit.id} já possui ciclo.`);
        }
      } catch (err) {
        this.logger.error(`Erro geral ao processar depósito ${deposit.id}:`, err);
      }
    }
  }
}
