import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { CreateSaqueDto } from './dto/create-saque.dto';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class SaquesService {
  private supabase;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_KEY;

    if (!url || !key) {
      throw new Error('❌ SUPABASE_URL ou SUPABASE_KEY não definidos no .env');
    }

    this.supabase = createClient(url, key);
  }

  async solicitarSaque(dto: CreateSaqueDto) {
    const { profile_id, value, type, wallet_id } = dto;

    // Buscar saldo do usuário
    const { data: user, error: userError } = await this.supabase
      .from('profiles')
      .select('balance')
      .eq('id', profile_id)
      .single();

    if (userError) throw new Error(userError.message);
    if (!user || user.balance < value) {
      throw new Error('Saldo insuficiente');
    }

    const taxa = value * 0.04;
    const valorFinal = Math.floor(value - taxa); // ou Math.round

    // Atualizar saldo
    const { error: updateError } = await this.supabase
      .from('profiles')
      .update({ balance: user.balance - value })
      .eq('id', profile_id);

    if (updateError) throw new Error(updateError.message);

    const timestamp = new Date().toISOString();

    // Registrar saque
    const { error: saqueError } = await this.supabase
      .from('saques')
      .insert([
        {
          profile_id,
          wallet_id,
          value: valorFinal,
          type,
          status: 0,
          created_at: timestamp,
          updated_at: timestamp,
        },
      ]);

    if (saqueError) throw new Error(saqueError.message);

    // Registrar extrato
    const { error: extratoError } = await this.supabase
    .from('extrato')
    .insert([
      {
        profile_id,
        value: valorFinal,
        type: 5, // tipo 5 = saque
        status: 0, // pendente
        ciclo_id: null, // ou algum ciclo_id, se houver
        created_at: timestamp,
        updated_at: timestamp,
      },
    ]);

    if (extratoError) throw new Error(extratoError.message);

    return {
      success: true,
      message: 'Saque solicitado com sucesso',
      valor_solicitado: value,
      valor_receber: valorFinal,
      taxa: taxa,
    };
  }
}
