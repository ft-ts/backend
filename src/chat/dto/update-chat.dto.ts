import { PartialType } from '@nestjs/mapped-types';
import { CreateChatMessageDto } from './create-chat-message.dto';
import { Field, Int } from '@nestjs/graphql';

export class UpdateChatDto extends PartialType(CreateChatMessageDto) {
  @Field(() => Int)
  id: number;
}
