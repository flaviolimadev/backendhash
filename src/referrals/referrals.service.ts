import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class ReferralsService {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL as string;
    const supabaseKey = process.env.SUPABASE_KEY as string;

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async getReferredProfiles(profileId: string, level = 1, maxLevel = 10): Promise<any[]> {
    if (level > maxLevel) return [];

    const { data: referred, error } = await this.supabase
      .from('profiles')
      .select('id, first_name, email, created_at')
      .eq('referred_by', profileId);

    if (error) throw new Error(error.message);

    const children = await Promise.all(
      referred.map(async (child) => ({
        id: child.id,
        first_name: child.first_name,
        email: child.email,
        created_at: child.created_at,
        level,
        referred: await this.getReferredProfiles(child.id, level + 1, maxLevel),
      })),
    );

    return children;
  }
}
