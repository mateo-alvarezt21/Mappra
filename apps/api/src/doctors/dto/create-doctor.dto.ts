import { IsString, IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDoctorDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsUUID() specialty_id: string;
  @ApiPropertyOptional() @IsOptional() @IsString() license_number?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() available?: boolean;
}
