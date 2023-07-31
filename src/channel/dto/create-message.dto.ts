import { IsNotEmpty, IsString } from "class-validator";

export class CreateMessageDto {
	@IsNotEmpty()
	channelId: number;

	@IsNotEmpty()
	@IsString()
	content: string;
  }
