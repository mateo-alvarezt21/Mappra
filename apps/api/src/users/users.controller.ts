import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get('me/preferences')
  @ApiOperation({ summary: 'Obtener preferencias del usuario autenticado' })
  getPreferences(@Request() req: any) {
    return this.service.getPreferences(req.user.userId);
  }

  @Patch('me/preferences')
  @ApiOperation({ summary: 'Guardar preferencias del usuario (tema, etc.)' })
  updatePreferences(@Request() req: any, @Body() dto: UpdatePreferencesDto) {
    return this.service.updatePreferences(req.user.userId, dto);
  }
}
