import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Injectable()
export class UsersService {
  private db: SupabaseClient;

  constructor(config: ConfigService) {
    this.db = createClient(
      config.get<string>('SUPABASE_URL')!,
      config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  async getPreferences(userId: string) {
    const { data } = await this.db
      .from('user_preferences')
      .select('theme')
      .eq('user_id', userId)
      .single();
    return { theme: data?.theme ?? 'light' };
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    const { data, error } = await this.db
      .from('user_preferences')
      .upsert({ user_id: userId, theme: dto.theme, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}
