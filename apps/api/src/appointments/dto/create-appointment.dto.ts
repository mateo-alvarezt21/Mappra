import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty() @IsString() patientName: string;
  @ApiPropertyOptional() @IsOptional() @IsString() document?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() documentType?: string;
  @ApiProperty() @IsString() specialty: string;
  @ApiProperty() @IsString() doctorId: string;
  @ApiProperty() @IsString() date: string;       // YYYY-MM-DD
  @ApiProperty() @IsString() time: string;       // HH:MM (24h)
  @ApiProperty() @IsString() ampm: string;       // AM | PM
  @ApiPropertyOptional() @IsOptional() @IsString() contactChannel?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() color?: string;
}
