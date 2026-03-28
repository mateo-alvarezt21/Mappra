import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'KPIs del día: citas, pacientes, validaciones' })
  getSummary() {
    return this.service.getSummary();
  }

  @Get('appointments-by-specialty')
  @ApiOperation({ summary: 'Distribución de citas por especialidad' })
  bySpecialty() {
    return this.service.bySpecialty();
  }

  @Get('daily-volume')
  @ApiOperation({ summary: 'Volumen diario de citas (últimos N días)' })
  dailyVolume(@Query('days') days = '7') {
    return this.service.dailyVolume(Number(days));
  }

  @Get('channel-distribution')
  @ApiOperation({ summary: 'Distribución de citas por canal' })
  channelDistribution() {
    return this.service.channelDistribution();
  }
}
