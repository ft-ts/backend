import { PartialType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsString } from 'class-validator';

export class MessageDto {
  @IsNotEmpty()
  channelId: number;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  user: {
    id: number;
    username: string;
  };

  @IsNotEmpty()
  timeStamp: Date;
}