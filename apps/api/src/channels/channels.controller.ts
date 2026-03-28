import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ChannelsService } from './channels.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';

@ApiTags('channels')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('channels')
export class ChannelsController {
  constructor(private readonly service: ChannelsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar webhooks configurados' })
  findAll() { return this.service.findAll(); }

  @Post()
  @ApiOperation({ summary: 'Crear webhook' })
  create(@Body() dto: CreateWebhookDto) { return this.service.create(dto); }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar webhook (incluye toggle activo/inactivo)' })
  update(@Param('id') id: string, @Body() dto: UpdateWebhookDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar webhook' })
  remove(@Param('id') id: string) { return this.service.remove(id); }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Últimas 20 entregas del webhook' })
  logs(@Param('id') id: string) { return this.service.getLogs(id); }

  @Post(':id/test')
  @ApiOperation({ summary: 'Enviar payload de prueba al webhook' })
  test(@Param('id') id: string) { return this.service.test(id); }
}
