import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ChannelMode } from '../enum/channelMode.enum';

export class CreateChannelDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsEnum(ChannelMode)
  mode: ChannelMode;

  @IsOptional()
  @IsString()
  password: string;
}
