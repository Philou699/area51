import { ApiProperty } from '@nestjs/swagger';

export class LetterboxdActivityPreviewDto {
  @ApiProperty({
    enum: ['review', 'diary', 'watched', 'list', 'rating'],
    example: 'review',
  })
  type!: 'review' | 'diary' | 'watched' | 'list' | 'rating';

  @ApiProperty({ example: 'Interstellar' })
  filmTitle!: string;

  @ApiProperty({ example: 2014, nullable: true })
  filmYear!: number | null;

  @ApiProperty({ example: 4.5, nullable: true })
  rating!: number | null;

  @ApiProperty({
    example: 'Watched for the third time and it still blows my mind.',
    nullable: true,
  })
  reviewText!: string | null;

  @ApiProperty({
    example: '2025-01-18T21:15:00.000Z',
    nullable: true,
  })
  watchedDate!: string | null;

  @ApiProperty({ example: 'https://letterboxd.com/user/film/interstellar/' })
  letterboxdUrl!: string;

  @ApiProperty({ example: '2025-01-19T09:30:00.000Z' })
  activityDate!: string;

  @ApiProperty({ example: true, nullable: true })
  isRewatch!: boolean | null;
}

export class LetterboxdTestResponseDto {
  @ApiProperty({ example: 'cinephile42' })
  username!: string;

  @ApiProperty({ example: 25 })
  count!: number;

  @ApiProperty({ type: [LetterboxdActivityPreviewDto] })
  activities!: LetterboxdActivityPreviewDto[];
}

export class LetterboxdPollingResponseDto {
  @ApiProperty({ example: 'Polling triggered successfully' })
  message!: string;
}
