import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { WebhookEmitterService } from '../channels/webhook-emitter.service';

@Injectable()
export class AppointmentsService {
  private db: SupabaseClient;

  constructor(
    private config: ConfigService,
    private webhooks: WebhookEmitterService,
  ) {
    this.db = createClient(
      this.config.get<string>('SUPABASE_URL')!,
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  // Map a raw DB row (with joined tables) to the frontend Appointment shape
  private mapRow(row: any) {
    const rawTime: string = row.scheduled_time ?? '00:00:00';
    const [h, m] = rawTime.split(':').map(Number);
    const ampm = h < 12 ? 'AM' : 'PM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;

    return {
      id: row.id,
      patientName: row.patients?.full_name ?? 'Paciente',
      specialty: row.specialties?.name ?? '',
      doctor: row.doctors?.name ?? '',
      date: row.scheduled_date,
      time: `${h12}:${String(m).padStart(2, '0')}`,
      ampm,
      status: row.status ?? 'Confirmada',
      color: row.color ?? 'teal',
      channel: row.channel,
    };
  }

  async findAll(date?: string) {
    let query = this.db
      .from('appointments')
      .select('*, patients(full_name), doctors(name), specialties(name)')
      .order('scheduled_date')
      .order('scheduled_time');
    if (date) query = query.eq('scheduled_date', date);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(r => this.mapRow(r));
  }

  async create(dto: CreateAppointmentDto) {
    // 1. Find or create patient by document number
    let patientId: string | null = null;
    let epsValidation = { validated: false, status: 'Sin información', eps: null as string | null };

    if (dto.document) {
      const { data: existing } = await this.db
        .from('patients')
        .select('id, affiliation_status, eps(name)')
        .eq('document_number', dto.document)
        .maybeSingle();

      if (existing) {
        patientId = existing.id;
        const epsName = (existing.eps as any)?.name ?? null;
        const affStatus = existing.affiliation_status ?? 'Sin información';
        epsValidation = {
          validated: affStatus === 'Activa',
          status: affStatus,
          eps: epsName,
        };
      } else {
        const { data: created, error: patientErr } = await this.db
          .from('patients')
          .insert({
            full_name: dto.patientName,
            document_type: dto.documentType ?? 'CC',
            document_number: dto.document,
          })
          .select('id')
          .single();
        if (!patientErr) patientId = created.id;
        // New patient — no EPS data yet
        epsValidation = { validated: false, status: 'Sin registro previo', eps: null };
      }
    }

    // 2. Look up specialty_id by name
    let specialtyId: string | null = null;
    if (dto.specialty) {
      const { data: spec } = await this.db
        .from('specialties')
        .select('id')
        .ilike('name', dto.specialty)
        .maybeSingle();
      specialtyId = spec?.id ?? null;
    }

    // 3. Conflict check — same doctor, same date, same time, not cancelled
    const { data: conflict } = await this.db
      .from('appointments')
      .select('id')
      .eq('doctor_id', dto.doctorId)
      .eq('scheduled_date', dto.date)
      .eq('scheduled_time', dto.time)
      .neq('status', 'Cancelada')
      .maybeSingle();

    if (conflict) {
      throw new ConflictException(
        `El médico ya tiene una cita agendada a las ${dto.time} el ${dto.date}`,
      );
    }

    // 4. Insert — status depends on EPS validation result
    //    Validated & active → 'Pendiente' (normal confirmation flow)
    //    Not validated       → 'Pendiente' + note flagging manual EPS review
    const initialStatus = 'Pendiente';
    const initialNotes = epsValidation.validated
      ? null
      : '[EPS pendiente de validación manual]';

    const { data, error } = await this.db
      .from('appointments')
      .insert({
        patient_id: patientId,
        doctor_id: dto.doctorId,
        specialty_id: specialtyId,
        scheduled_date: dto.date,
        scheduled_time: dto.time,
        channel: dto.contactChannel ?? 'WhatsApp',
        color: dto.color ?? 'teal',
        status: initialStatus,
        notes: initialNotes,
      })
      .select('*, patients(full_name), doctors(name), specialties(name)')
      .single();

    if (error) throw new InternalServerErrorException(error.message);

    const result = { ...this.mapRow(data), epsValidation };

    this.webhooks.emit('appointment.created', {
      ...this.mapRow(data),
      epsValidation,
    });

    return result;
  }

  async updateStatus(id: string, dto: UpdateAppointmentStatusDto) {
    const { data, error } = await this.db
      .from('appointments')
      .update({ status: dto.status })
      .eq('id', id)
      .select('*, patients(full_name), doctors(name), specialties(name)')
      .single();
    if (error) throw error;
    return this.mapRow(data);
  }

  async update(id: string, dto: UpdateAppointmentDto) {
    const patch: Record<string, any> = {};
    if (dto.status  !== undefined) patch.status  = dto.status;
    if (dto.notes   !== undefined) patch.notes   = dto.notes;
    if (dto.channel !== undefined) patch.channel = dto.channel;
    const { data, error } = await this.db
      .from('appointments')
      .update(patch)
      .eq('id', id)
      .select('*, patients(full_name), doctors(name), specialties(name)')
      .single();
    if (error) throw new InternalServerErrorException(error.message);
    const mapped = this.mapRow(data);

    const event = dto.status === 'Cancelada'
      ? 'appointment.cancelled'
      : 'appointment.status_changed';
    this.webhooks.emit(event as any, mapped);

    return mapped;
  }
}
