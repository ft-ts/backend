import { IsInt, IsNotEmpty, IsString } from "class-validator";

export class CreateMessageDto {
	@IsNotEmpty()
	@IsInt()
	channelId: number;

	@IsNotEmpty()
	@IsString()
	content: string;
  }
