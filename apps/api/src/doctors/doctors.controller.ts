import { Controller, Get, Post, Patch, Put, Body, Param, Query, UseGuards, ParseBoolPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { SetSchedulesDto } from './dto/schedule.dto';

@ApiTags('doctors')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly service: DoctorsService) {}

  @Get('specialties')
  @ApiOperation({ summary: 'Listar especialidades' })
  findSpecialties() {
    return this.service.findAllSpecialties();
  }

  @Get()
  @ApiOperation({ summary: 'Listar médicos. ?specialty=X para filtrar, ?onlyAvailable=true para solo disponibles' })
  findAll(
    @Query('specialty') specialty?: string,
    @Query('onlyAvailable', new DefaultValuePipe(false), ParseBoolPipe) onlyAvailable?: boolean,
  ) {
    return this.service.findAll(specialty, onlyAvailable);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener médico por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar nuevo médico' })
  create(@Body() dto: CreateDoctorDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar médico (nombre, licencia, disponibilidad)' })
  update(@Param('id') id: string, @Body() dto: UpdateDoctorDto) {
    return this.service.update(id, dto);
  }

  @Get(':id/schedules')
  @ApiOperation({ summary: 'Obtener horarios del médico' })
  getSchedules(@Param('id') id: string) {
    return this.service.getSchedules(id);
  }

  @Put(':id/schedules')
  @ApiOperation({ summary: 'Reemplazar horarios del médico' })
  setSchedules(@Param('id') id: string, @Body() dto: SetSchedulesDto) {
    return this.service.setSchedules(id, dto.schedules);
  }

  @Get(':id/slots')
  @ApiOperation({ summary: 'Slots disponibles para una fecha: ?date=YYYY-MM-DD' })
  getSlots(@Param('id') id: string, @Query('date') date: string) {
    return this.service.getAvailableSlots(id, date);
  }
}
