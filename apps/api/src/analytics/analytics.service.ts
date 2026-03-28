import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class AnalyticsService {
  private db: SupabaseClient;

  constructor(config: ConfigService) {
    this.db = createClient(
      config.get<string>('SUPABASE_URL')!,
      config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  async getSummary() {
    const today = new Date().toISOString().split('T')[0];
    const [appts, patients, validations] = await Promise.all([
      this.db
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('scheduled_date', today),
      this.db
        .from('patients')
        .select('id', { count: 'exact', head: true }),
      this.db
        .from('eps_validations')
        .select('id', { count: 'exact', head: true })
        .eq('result_status', 'Activa'),
    ]);
    return {
      todayAppointments: appts.count ?? 0,
      totalPatients: patients.count ?? 0,
      activeValidations: validations.count ?? 0,
    };
  }

  async bySpecialty() {
    const { data, error } = await this.db
      .from('appointments')
      .select('specialty_id, specialties(name)');
    if (error) throw error;
    const counts: Record<string, number> = {};
    data?.forEach((r: any) => {
      const name = r.specialties?.name ?? 'Desconocida';
      counts[name] = (counts[name] ?? 0) + 1;
    });
    return Object.entries(counts).map(([specialty, count]) => ({ specialty, count }));
  }

  async dailyVolume(days: number) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const { data, error } = await this.db
      .from('appointments')
      .select('scheduled_date')
      .gte('scheduled_date', since.toISOString().split('T')[0]);
    if (error) throw error;
    const counts: Record<string, number> = {};
    data?.forEach((r: any) => {
      counts[r.scheduled_date] = (counts[r.scheduled_date] ?? 0) + 1;
    });
    return Object.entries(counts).map(([date, count]) => ({ date, count }));
  }

  async channelDistribution() {
    const { data, error } = await this.db
      .from('appointments')
      .select('channel');
    if (error) throw error;
    const counts: Record<string, number> = {};
    data?.forEach((r: any) => {
      counts[r.channel] = (counts[r.channel] ?? 0) + 1;
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return Object.entries(counts).map(([channel, count]) => ({
      channel,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
  }
}
