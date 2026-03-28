import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { ScheduleBlockDto } from './dto/schedule.dto';

@Injectable()
export class DoctorsService {
  private db: SupabaseClient;

  constructor(config: ConfigService) {
    this.db = createClient(
      config.get<string>('SUPABASE_URL')!,
      config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  async findAll(specialty?: string, onlyAvailable = false) {
    let query = this.db
      .from('doctors')
      .select('*, specialties(name, color)')
      .order('name');
    if (onlyAvailable) query = query.eq('available', true);
    const { data, error } = await query;
    if (error) throw error;
    if (!specialty) return data ?? [];
    return (data ?? []).filter(
      (d) => d.specialties?.name?.toLowerCase() === specialty.toLowerCase(),
    );
  }

  async findOne(id: string) {
    const { data, error } = await this.db
      .from('doctors')
      .select('*, specialties(name, color)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async create(dto: CreateDoctorDto) {
    const { data, error } = await this.db
      .from('doctors')
      .insert(dto)
      .select('*, specialties(name, color)')
      .single();
    if (error) throw error;
    return data;
  }

  async update(id: string, dto: UpdateDoctorDto) {
    const { data, error } = await this.db
      .from('doctors')
      .update(dto)
      .eq('id', id)
      .select('*, specialties(name, color)')
      .single();
    if (error) throw error;
    return data;
  }

  async getSchedules(doctorId: string) {
    const { data, error } = await this.db
      .from('doctor_schedules')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('day_of_week');
    if (error) throw error;
    return data ?? [];
  }

  async setSchedules(doctorId: string, schedules: ScheduleBlockDto[]) {
    await this.db.from('doctor_schedules').delete().eq('doctor_id', doctorId);
    if (schedules.length === 0) return [];
    const { data, error } = await this.db
      .from('doctor_schedules')
      .insert(schedules.map(s => ({ ...s, doctor_id: doctorId })))
      .select();
    if (error) throw error;
    return data ?? [];
  }

  async getAvailableSlots(doctorId: string, date: string) {
    // Determine day of week (avoid TZ shift by using noon)
    const dayOfWeek = new Date(`${date}T12:00:00`).getDay();

    const { data: schedule } = await this.db
      .from('doctor_schedules')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('day_of_week', dayOfWeek)
      .maybeSingle();

    if (!schedule) return [];

    // Generate all possible slot times
    const toMins = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const startMins = toMins(schedule.start_time);
    const endMins = toMins(schedule.end_time);
    const duration: number = schedule.slot_duration_minutes;

    const allSlots: string[] = [];
    for (let m = startMins; m + duration <= endMins; m += duration) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      allSlots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
    }

    // Get already booked appointments for this doctor on this date
    const { data: booked } = await this.db
      .from('appointments')
      .select('scheduled_time')
      .eq('doctor_id', doctorId)
      .eq('scheduled_date', date)
      .neq('status', 'Cancelada');

    const bookedSet = new Set(
      (booked ?? []).map((a: any) =>
        typeof a.scheduled_time === 'string' ? a.scheduled_time.slice(0, 5) : '',
      ),
    );

    return allSlots.map(time => ({
      time,
      available: !bookedSet.has(time),
    }));
  }

  async findAllSpecialties() {
    const { data, error } = await this.db
      .from('specialties')
      .select('id, name, color')
      .order('name');
    if (error) throw error;
    return data;
  }
}
