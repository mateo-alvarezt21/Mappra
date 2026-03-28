import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';

@ApiTags('appointments')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly service: AppointmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar citas, opcionalmente filtrar por fecha' })
  findAll(@Query('date') date?: string) {
    return this.service.findAll(date);
  }

  @Post()
  @ApiOperation({ summary: 'Crear nueva cita' })
  create(@Body() dto: CreateAppointmentDto) {
    return this.service.create(dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Actualizar estado de cita' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateAppointmentStatusDto) {
    return this.service.updateStatus(id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar cita (estado, notas, canal)' })
  update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    return this.service.update(id, dto);
  }
}
