import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';

export type WebhookEvent =
  | 'appointment.created'
  | 'appointment.status_changed'
  | 'appointment.cancelled'
  | 'eps_validation.completed';

@Injectable()
export class WebhookEmitterService {
  private readonly logger = new Logger(WebhookEmitterService.name);
  private db: SupabaseClient;

  constructor(config: ConfigService) {
    this.db = createClient(
      config.get<string>('SUPABASE_URL')!,
      config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  /**
   * Emit an event to all active webhooks subscribed to it.
   * Fire-and-forget — does NOT block the calling request.
   */
  emit(event: WebhookEvent, data: Record<string, unknown>): void {
    // Intentionally not awaited so the caller is never delayed
    this.fireAll(event, data).catch(err =>
      this.logger.error('WebhookEmitter unexpected error', err),
    );
  }

  private async fireAll(event: WebhookEvent, data: Record<string, unknown>) {
    const { data: hooks } = await this.db
      .from('webhooks')
      .select('id, url, secret')
      .eq('active', true)
      .contains('events', [event]);

    if (!hooks?.length) return;

    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };
    const body = JSON.stringify(payload);

    await Promise.all(hooks.map(hook => this.fire(hook, event, body, payload)));
  }

  private async fire(
    hook: { id: string; url: string; secret?: string | null },
    event: string,
    body: string,
    payload: object,
  ) {
    const start = Date.now();
    let httpStatus: number | null = null;
    let error: string | null = null;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Mappra-Event': event,
    };

    if (hook.secret) {
      const sig = createHmac('sha256', hook.secret).update(body).digest('hex');
      headers['X-Mappra-Signature'] = `sha256=${sig}`;
    }

    try {
      const res = await fetch(hook.url, { method: 'POST', headers, body });
      httpStatus = res.status;
    } catch (err: any) {
      error = err?.message ?? 'fetch failed';
      this.logger.warn(`Webhook ${hook.id} → ${hook.url} failed: ${error}`);
    }

    const response_ms = Date.now() - start;

    // Log delivery
    await this.db.from('webhook_delivery_logs').insert({
      webhook_id: hook.id,
      event,
      payload,
      http_status: httpStatus,
      response_ms,
      error,
    });

    // Update last_triggered_at + last_http_status on the webhook
    await this.db
      .from('webhooks')
      .update({ last_triggered_at: new Date().toISOString(), last_http_status: httpStatus })
      .eq('id', hook.id);
  }
}
