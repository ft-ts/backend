import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
} from 'class-validator';
import { MatchType } from '../enum/matchType.enum';

export class CreatePongDto {
  @IsNotEmpty()
  @IsInt()
  user1_id: number;

  @IsNotEmpty()
  @IsInt()
  user2_id: number;

  @IsNotEmpty()
  @IsEnum(MatchType)
  match_type: MatchType;

  @IsNotEmpty()
  @IsInt()
  user1_score: number;

  @IsNotEmpty()
  @IsInt()
  user2_score: number;

  @IsNotEmpty()
  @IsInt()
  winner_id: number;

  @IsNotEmpty()
  timestamp: Date;
}
