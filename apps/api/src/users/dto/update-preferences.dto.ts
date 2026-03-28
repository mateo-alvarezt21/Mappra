import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePreferencesDto {
  @ApiProperty({ enum: ['light', 'dark'] })
  @IsIn(['light', 'dark'])
  theme: 'light' | 'dark';
}
