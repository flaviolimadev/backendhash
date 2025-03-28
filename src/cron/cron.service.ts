import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class CronService {
  private supabase;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_KEY;

    if (!url || !key) throw new Error('SUPABASE_URL ou SUPABASE_KEY ausentes');

    this.supabase = createClient(url, key);
  }

  // Executa todos os dias às 8h
  @Cron('0 6 * * *')
  async gerarRendimentosDiarios() {
    const today = new Date().toISOString().split('T')[0];

    const { data: ciclos, error } = await this.supabase
      .from('ciclos')
      .select('id, profile_id, nivel, value')
      .eq('status', 1);

    if (error) throw new Error(error.message);

    for (const ciclo of ciclos) {
      // Verifica se já tem rendimento hoje
      const { data: existentes } = await this.supabase
        .from('rendimento')
        .select('id')
        .eq('ciclo_id', ciclo.id)
        .gte('created_at', `${today}T00:00:00.000Z`);

      if (existentes && existentes.length > 0) continue; // já recebeu hoje

      // Calcular porcentagem
      const porcentagem = ciclo.nivel / 100;
      const valorLucro = Math.floor(ciclo.value * porcentagem);

      const timestamp = new Date().toISOString();

      // Criar rendimento
      await this.supabase.from('rendimento').insert([
        {
          ciclo_id: ciclo.id,
          valor: valorLucro,
          descricao: `Rendimento diário nível ${ciclo.nivel}`,
          created_at: timestamp,
        },
      ]);

      // Adicionar ao extrato
      await this.supabase.from('extrato').insert([
        {
          profile_id: ciclo.profile_id,
          ciclo_id: ciclo.id,
          value: valorLucro,
          type: 1, // rendimento
          status: 1, // aprovado
          created_at: timestamp,
          updated_at: timestamp,
        },
      ]);

      // Atualizar saldo do usuário
      const { data: usuario } = await this.supabase
        .from('profiles')
        .select('balance')
        .eq('id', ciclo.profile_id)
        .single();

      await this.supabase
        .from('profiles')
        .update({ balance: usuario.balance + valorLucro })
        .eq('id', ciclo.profile_id);

      // Verificar total de rendimentos do nível atual
      const { data: rendimentosPorNivel } = await this.supabase
        .from('rendimento')
        .select('id')
        .eq('ciclo_id', ciclo.id)
        .eq('descricao', `Rendimento diário nível ${ciclo.nivel}`);

      if (rendimentosPorNivel && rendimentosPorNivel.length >= 5 && ciclo.nivel < 6) {
        await this.supabase
          .from('ciclos')
          .update({ nivel: ciclo.nivel + 1, updated_at: timestamp })
          .eq('id', ciclo.id);
      }
    }

    console.log(`[Cron] Rendimentos diários aplicados em ${new Date().toLocaleString()}`);
  }
}
