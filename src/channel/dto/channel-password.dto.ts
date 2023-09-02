import { IsNumber, IsString, Length } from 'class-validator';

export class ChannelPasswordDto {
  @IsNumber()
  channelId: number;
  @Length(4, 4)
  @IsString()
  password: string;
}