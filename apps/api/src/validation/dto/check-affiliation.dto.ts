import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckAffiliationDto {
  @ApiProperty({ enum: ['CC', 'TI', 'CE', 'PA', 'RC'] })
  @IsIn(['CC', 'TI', 'CE', 'PA', 'RC'])
  document_type: string;

  @ApiProperty() @IsString() document_number: string;
}
