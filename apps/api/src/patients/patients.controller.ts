import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';

@ApiTags('patients')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('patients')
export class PatientsController {
  constructor(private readonly service: PatientsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar pacientes, buscar por documento' })
  findAll(@Query('document') document?: string) {
    return this.service.findAll(document);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener paciente por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar nuevo paciente' })
  create(@Body() dto: CreatePatientDto) {
    return this.service.create(dto);
  }
}
