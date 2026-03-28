import { IsString, IsUrl, IsArray, IsBoolean, IsOptional } from 'class-validator';

export class UpdateWebhookDto {
  @IsOptional() @IsString()   name?:   string;
  @IsOptional() @IsUrl({ require_tld: false }) url?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) events?: string[];
  @IsOptional() @IsBoolean() active?:  boolean;
  @IsOptional() @IsString()   secret?: string;
}
