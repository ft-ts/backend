import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channels } from './entities/channel.entity';
import { DmChannels } from './entities/internal';
import { GroupChannels } from './entities/groupChannel.entity';
import { GroupChannelUser } from './entities/groupChannelUser.entity';
import { ChatMessage } from './entities/chatMessage.entity';
import { DmChannelUser } from './entities/dmChannelUser.entity';
import { DmChannelService, GroupChannelService } from './channel.service';
import { DmChannelController, GroupChannelController } from './chat.controller';
import { ChannelGateway } from './channel.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Channels,
      GroupChannels,
      DmChannels,
      DmChannelUser,
      GroupChannelUser,
      ChatMessage,
    ]),
  ],
  controllers: [GroupChannelController, DmChannelController],
  providers: [ChatGateway, ChannelGateway,  ChatService, GroupChannelService, DmChannelService],
})
export class ChatModule {}
