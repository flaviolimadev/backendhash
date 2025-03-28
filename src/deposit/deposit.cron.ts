// src/deposit/deposit.cron.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SupabaseService } from '../supabase/supabase.service';
import axios from 'axios';

interface PixStatusResponse {
  txid: string;
  status: string;
  pixCopiaECola?: string;
  qrCode?: string;
}

@Injectable()
export class DepositCronService {
  private readonly logger = new Logger(DepositCronService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  // Executa a cada 30 segundos
  @Cron('*/30 * * * * *')
  async checkPendingPixDeposits() {
    this.logger.log('Verificando depósitos PIX pendentes...');

    const { data: deposits, error } = await this.supabaseService.getClient()
      .from('depositos')
      .select('*')
      .eq('type', 1)
      .eq('status', 0);

    if (error) {
      this.logger.error('Erro ao buscar depósitos:', error);
      return;
    }

    if (!deposits || deposits.length === 0) {
      this.logger.log('Nenhum depósito pendente encontrado.');
      return;
    }

    for (const deposit of deposits) {
      const { txid, created_at } = deposit;

      try {
        const response = await axios.get<PixStatusResponse>(`https://2gopay.azurewebsites.net/pix/${txid}`, {
          headers: {
            accept: '*/*',
            'client_id': 'asesonEYsiVErGeNdenIsetA',
          },
        });

        const status = response.data.status;

        if (status === 'pago') {
          const supabase = this.supabaseService.getClient();

          await supabase
            .from('depositos')
            .update({ status: 1 })
            .eq('txid', txid);

          const { data: ciclo, error: cicloError } = await supabase
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

          if (cicloError) {
            this.logger.error(`Erro ao criar ciclo para depósito ${txid}:`, cicloError);
            continue;
          }

          await supabase.from('extrato').insert([{
            profile_id: deposit.profile_id,
            ciclo_id: ciclo.id,
            type: 0,
            value: deposit.value,
            status: 1,
          }]);

          this.logger.log(`✅ Depósito ${txid} confirmado como pago e ciclo/extrato criados.`);
        } else {
          const createdAt = new Date(created_at);
          const now = new Date();
          const diffInHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

          if (diffInHours > 1) {
            await this.supabaseService.getClient()
              .from('depositos')
              .delete()
              .eq('txid', txid);

            this.logger.warn(`Depósito ${txid} removido por expiração (>1h).`);
          }
        }
      } catch (err: any) {
        if (err.response?.status === 503) {
          this.logger.warn(`⚠️ API da 2GoPay indisponível para o txid ${txid}. Tentará novamente mais tarde.`);
        } else {
          this.logger.error(`Erro inesperado ao verificar depósito ${txid}:`, err.message || err);
        }
        continue; // continua o loop mesmo com erro
      }
    }
  }
}
