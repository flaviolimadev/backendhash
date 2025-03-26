// src/deposit/deposit.service.ts

import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { SupabaseService } from '../supabase/supabase.service';

interface PixResponse {
  txid: string;
  status: string;
  pixCopiaECola: string;
  qrCode: string;
}

@Injectable()
export class DepositService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async generatePix(profileId: string, value: string, cpf: string) {
    try {
      const response = await axios.post<PixResponse>(
        'https://2gopay.azurewebsites.net/pix',
        {
          code: profileId,
          amount: Number(value),
          email: 'teste@email.com',
          document: cpf,
          url: 'https://suaurl.com/retorno',
        },
        {
          headers: {
            accept: '*/*',
            'client_id': 'asesonEYsiVErGeNdenIsetA',
            'Content-Type': 'application/json',
          },
        },
      );

      const { txid, status, pixCopiaECola, qrCode } = response.data;

      // 🟢 Inserção ajustada ao schema da tabela 'depositos'
      const { error } = await this.supabaseService.getClient()
        .from('depositos')
        .insert([{
          profile_id: profileId,
          value: (Number(value)/60)*100,
          txid,
          type: 1,       // define o tipo do depósito (ex: 1 = Pix manual)
          status: 0,     // 0 = pendente, 1 = confirmado (exemplo)
          bonus: 0       // se for depósito com bônus, pode controlar aqui
        }]);

      if (error) {
        console.error('Erro ao salvar no Supabase:', error);
        throw new Error('Erro ao salvar no banco de dados');
      }

      return {
        pixCopiaECola,
        qrCode,
      };
    } catch (error) {
      console.error('Erro ao gerar PIX:', error.response?.data || error.message);
      throw new Error('Erro ao gerar PIX');
    }
  }

  
}
