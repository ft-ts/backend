import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatResolver } from './chat.resolver';
import { ChatGateway } from './chat.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channels } from './entities/channels.entity';
import { GroupChannels } from './entities/groupChannels.entity';
import { GroupChannelUser } from './entities/groupChannelUser.entity';
import { ChatMessage } from './entities/chatMessage.entity';
import { DmChannelUser } from './entities/dmChannelUser.entity';
import { GroupChannelService } from './channel.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Channels,
      GroupChannels,
      DmChannelUser,
      GroupChannelUser,
      ChatMessage,
    ]),
  ],
  providers: [ChatGateway, ChatService, GroupChannelService, ChatResolver],
})
export class ChatModule {}
