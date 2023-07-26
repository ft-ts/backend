import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt } from 'class-validator';
import { ChannelMode } from '../enum/channelMode.enum';

export class CreateGroupChannelDto {
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

export class CreateDmChannelDto {
  @IsInt()
  userAId: number;

  @IsInt()
  userBId: number;
}
