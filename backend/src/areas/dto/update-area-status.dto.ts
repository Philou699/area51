import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';

export class UpdateAreaStatusDto {
  @ApiProperty({
    example: true,
    description: 'Whether the area should be enabled (executed) or disabled',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() === 'true' : Boolean(value),
  )
  @IsBoolean()
  enabled!: boolean;
}
