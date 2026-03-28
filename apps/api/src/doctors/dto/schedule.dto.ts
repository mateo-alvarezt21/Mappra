import { IsInt, IsString, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ScheduleBlockDto {
  @ApiProperty({ example: 1, description: '0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb' })
  @IsInt() @Min(0) @Max(6)
  day_of_week: number;

  @ApiProperty({ example: '08:00' })
  @IsString()
  start_time: string;

  @ApiProperty({ example: '17:00' })
  @IsString()
  end_time: string;

  @ApiProperty({ example: 30 })
  @IsInt() @Min(10) @Max(120)
  slot_duration_minutes: number;
}

export class SetSchedulesDto {
  @ApiProperty({ type: [ScheduleBlockDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleBlockDto)
  schedules: ScheduleBlockDto[];
}
