import { InputType, Field } from "@nestjs/graphql";
import { IsString, IsNotEmpty, IsOptional } from "class-validator";
import { ChannelMode } from "../enum/channelMode.enum";

@InputType()
export class CreateGroupChannelDto {
  @Field()
  @IsString()
  @IsNotEmpty()
  title: string;

  @Field()
  @IsNotEmpty()
  mode: ChannelMode;

  @Field()
  @IsString()
  @IsOptional()
  password: string;
}