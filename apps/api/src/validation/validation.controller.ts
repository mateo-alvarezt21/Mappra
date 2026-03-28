import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ValidationService } from './validation.service';
import { CheckAffiliationDto } from './dto/check-affiliation.dto';

@ApiTags('validation')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('validation')
export class ValidationController {
  constructor(private readonly service: ValidationService) {}

  @Get()
  @ApiOperation({ summary: 'Historial de validaciones de afiliación' })
  findAll() {
    return this.service.findAll();
  }

  @Post('check')
  @ApiOperation({ summary: 'Verificar cobertura EPS de un paciente' })
  check(@Body() dto: CheckAffiliationDto) {
    return this.service.check(dto);
  }
}
