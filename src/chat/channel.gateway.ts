import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { GroupChannelService, DmChannelService } from './channel.service';
import { CreateGroupChannelDto } from './dto/channel.dto';
import { User } from '../users/entities/user.entity';
import { GroupChannels } from './entities/groupChannel.entity';
import { DmChannels } from './entities/internal';

@WebSocketGateway({ namespace: 'chat' })
export class ChannelGateway {
  constructor(
    private readonly groupChannelService: GroupChannelService,
    private readonly dmChannelService: DmChannelService,
  ) {}

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('createGroupChannel')
  async createGroupChannel(client: any, createGroupChannelDto: CreateGroupChannelDto) {
    const user = client.user
    const channel = await this.groupChannelService.createGroupChannel(createGroupChannelDto, user);
  
    this.server.emit('newGroupChannel', channel);
  
    return channel;
  }

  @SubscribeMessage('getAllGroupChannels')
  async getAllGroupChannels(client: any, payload: any) {
    const channels = await this.groupChannelService.getAllGroupChannels();
    return channels;
  }

  @SubscribeMessage('getMyGroupChannels')
  async getMyGroupChannels(client: any, payload: any) {
    const user = client.user
    const channels = await this.groupChannelService.getMyGroupChannels(user);
    return channels;
  }

  @SubscribeMessage('getGroupChannelById')
  async getGroupChannelById(client: any, payload: any) {
    const channel = await this.groupChannelService.getGroupChannelById(payload.id);
    return channel;
  }

  @SubscribeMessage('enterGroupChannel')
  async enterGroupChannel(client: any, payload: any) {
    const user = client.user
    const channel = await this.groupChannelService.enterGroupChannel(user, payload.channelId, payload.password);
    return channel;
  }

  @SubscribeMessage('getChannelMembers')
  async getChannelMembers(client: any, payload: any) {
    const members = await this.groupChannelService.getChannelMembers(payload.channelId);
    return members;
  }

  @SubscribeMessage('createDmChannel')
  async createDmChannel(client: any, payload: any) {
    const userA = client.user
    const userB = payload.userB
    const channel = await this.dmChannelService.createDmChannel(userA, userB);
    return channel;
  }


}
