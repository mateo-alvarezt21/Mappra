import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAppointmentDto {
  @ApiPropertyOptional({ enum: ['Confirmada', 'Pendiente', 'Cancelada', 'En consulta', 'Atendida'] })
  @IsOptional()
  @IsIn(['Confirmada', 'Pendiente', 'Cancelada', 'En consulta', 'Atendida'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  channel?: string;
}
