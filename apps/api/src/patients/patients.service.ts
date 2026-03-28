import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreatePatientDto } from './dto/create-patient.dto';

@Injectable()
export class PatientsService {
  private db: SupabaseClient;

  constructor(config: ConfigService) {
    this.db = createClient(
      config.get<string>('SUPABASE_URL')!,
      config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  async findAll(document?: string) {
    let query = this.db.from('patients').select('*');
    if (document) query = query.eq('document_number', document);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.db
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async create(dto: CreatePatientDto) {
    const { data, error } = await this.db
      .from('patients')
      .insert(dto)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}
