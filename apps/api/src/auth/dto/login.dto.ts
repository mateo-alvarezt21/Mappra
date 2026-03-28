import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'doctor@ips.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'secret' })
  @IsString()
  @MinLength(6)
  password: string;
}
