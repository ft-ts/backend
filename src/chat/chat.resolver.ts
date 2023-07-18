import { Resolver } from '@nestjs/graphql';
import { ChatMessage } from './entities/chatMessage.entity';

@Resolver(() => ChatMessage)
export class ChatResolver {}
