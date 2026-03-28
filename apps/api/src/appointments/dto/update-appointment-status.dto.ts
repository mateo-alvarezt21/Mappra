import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AppointmentStatus } from '@mappra/types';

export class UpdateAppointmentStatusDto {
  @ApiProperty({ enum: ['Confirmada', 'Pendiente', 'Cancelada', 'En consulta', 'Completada'] })
  @IsIn(['Confirmada', 'Pendiente', 'Cancelada', 'En consulta', 'Completada'])
  status: AppointmentStatus;
}
