import { IsString, IsIn, IsOptional, IsEmail, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePatientDto {
  @ApiProperty() @IsString() full_name: string;

  @ApiProperty({ enum: ['CC', 'TI', 'CE', 'PA', 'RC'] })
  @IsIn(['CC', 'TI', 'CE', 'PA', 'RC'])
  document_type: string;

  @ApiProperty() @IsString() document_number: string;
  @ApiProperty() @IsString() eps_id: string;

  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() birth_date?: string;

  @ApiPropertyOptional({ enum: ['M', 'F', 'otro'] })
  @IsOptional()
  @IsIn(['M', 'F', 'otro'])
  gender?: string;
}
