import { IsString, IsUrl, IsArray, IsBoolean, IsOptional, ArrayMinSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const WEBHOOK_EVENTS = [
  'appointment.created',
  'appointment.status_changed',
  'appointment.cancelled',
  'eps_validation.completed',
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export class CreateWebhookDto {
  @ApiProperty({ example: 'Recordatorio WhatsApp' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'https://n8n.miips.com/webhook/abc123' })
  @IsUrl({ require_tld: false }) // allow localhost for dev
  url: string;

  @ApiProperty({ type: [String], example: ['appointment.created', 'appointment.cancelled'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  events: string[];

  @ApiPropertyOptional({ description: 'HMAC-SHA256 signing secret. Sent as X-Mappra-Signature header.' })
  @IsOptional()
  @IsString()
  secret?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
