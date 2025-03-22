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

    // 1. Buscar depósitos com type = 1 (PIX) e status = 0 (pendente)
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
      try {
        const { txid, created_at } = deposit;

        // Consulta a API da 2GoPay
        const response = await axios.get<PixStatusResponse>(`https://2gopay.azurewebsites.net/pix/${txid}`, {
          headers: {
            accept: '*/*',
            'client_id': 'asesonEYsiVErGeNdenIsetA',
          },
        });

        const status = response.data.status;

        if (status === 'pago') {
          // Atualiza o status do depósito para 1 (concluído)
          await this.supabaseService.getClient()
            .from('depositos')
            .update({ status: 1 })
            .eq('txid', txid);

            // Cria um novo ciclo
            await this.supabaseService.getClient()
            .from('ciclos')
            .insert([{
                profile_id: deposit.profile_id,
                nivel: 1,
                value: deposit.value,
                status: 1
            }]);

          this.logger.log(`Depósito ${txid} confirmado como pago.`);
        } else {
          // Verifica se passou mais de 24 horas desde a criação
          const createdAt = new Date(created_at);
          const now = new Date();
          const diffInHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

          if (diffInHours > 24) {
            await this.supabaseService.getClient()
              .from('depositos')
              .delete()
              .eq('txid', txid);

            this.logger.warn(`Depósito ${txid} removido por expiração (>24h).`);
          }
        }
      } catch (err) {
        this.logger.error(`Erro ao verificar depósito ${deposit.txid}:`, err);
      }
    }
  }
}
