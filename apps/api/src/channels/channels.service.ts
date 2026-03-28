import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';

@Injectable()
export class ChannelsService {
  private db: SupabaseClient;

  constructor(config: ConfigService) {
    this.db = createClient(
      config.get<string>('SUPABASE_URL')!,
      config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  async findAll() {
    const { data, error } = await this.db
      .from('webhooks')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(w => this.sanitize(w));
  }

  async create(dto: CreateWebhookDto) {
    const { data, error } = await this.db
      .from('webhooks')
      .insert({
        name: dto.name,
        url: dto.url,
        events: dto.events,
        secret: dto.secret ?? null,
        active: dto.active ?? true,
      })
      .select('*')
      .single();
    if (error) throw error;
    return this.sanitize(data);
  }

  async update(id: string, dto: UpdateWebhookDto) {
    const patch: Record<string, unknown> = {};
    if (dto.name   !== undefined) patch.name   = dto.name;
    if (dto.url    !== undefined) patch.url    = dto.url;
    if (dto.events !== undefined) patch.events = dto.events;
    if (dto.active !== undefined) patch.active = dto.active;
    if (dto.secret !== undefined) patch.secret = dto.secret;

    const { data, error } = await this.db
      .from('webhooks')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    if (!data) throw new NotFoundException('Webhook no encontrado');
    return this.sanitize(data);
  }

  async remove(id: string) {
    const { error } = await this.db.from('webhooks').delete().eq('id', id);
    if (error) throw error;
    return { deleted: true };
  }

  async getLogs(id: string) {
    const { data, error } = await this.db
      .from('webhook_delivery_logs')
      .select('id, event, http_status, response_ms, error, triggered_at')
      .eq('webhook_id', id)
      .order('triggered_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    return data ?? [];
  }

  /** Send a test payload to the webhook URL immediately (synchronous). */
  async test(id: string) {
    const { data: hook } = await this.db
      .from('webhooks')
      .select('url, secret')
      .eq('id', id)
      .single();
    if (!hook) throw new NotFoundException('Webhook no encontrado');

    const payload = JSON.stringify({
      event: 'test',
      timestamp: new Date().toISOString(),
      data: { message: 'Mappra webhook test — todo funciona correctamente.' },
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Mappra-Event': 'test',
    };

    if (hook.secret) {
      const { createHmac } = await import('crypto');
      const sig = createHmac('sha256', hook.secret).update(payload).digest('hex');
      headers['X-Mappra-Signature'] = `sha256=${sig}`;
    }

    const start = Date.now();
    try {
      const res = await fetch(hook.url, { method: 'POST', headers, body: payload });
      return { success: res.ok, status: res.status, ms: Date.now() - start };
    } catch (err: any) {
      return { success: false, status: null, error: err?.message, ms: Date.now() - start };
    }
  }

  /** Mask the secret so it's never returned in full to the frontend. */
  private sanitize(row: any) {
    const { secret, ...rest } = row;
    return { ...rest, hasSecret: !!secret };
  }
}
