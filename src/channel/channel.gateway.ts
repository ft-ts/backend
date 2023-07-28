import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { ChannelService } from './channel.service';
import { UnauthorizedException } from 'src/common/exceptions/authorization.execption';
import { CreateChannelDto } from './dto/create-channel.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageDto } from './dto/message.dto';
import { UseGuards } from '@nestjs/common';
import { ChannelAuthGuard } from './guards/channel-auth.guard';
import { User } from 'src/user/entities/user.entity';

@WebSocketGateway({
  namespace: 'channels', 
  cors: {
    origin: process.env.FRONT_PORT,
  },
})
export class ChannelGateway {
  constructor(
    private readonly chatService: ChannelService,
    private readonly authService: AuthService,
  ) { }

  @WebSocketServer()
  server: Server;

  async handleConnection(client: Socket) {
    const payload = await this.authService.validateToken(client.handshake.headers.authorization);
    if (!payload) {
      client.disconnect(true);
      return;
    }
    const user = await this.getAuthenticatedUser(payload.uid);
    if (!user) {
      client.disconnect(true);
      return;
    }
    client.data = { uid: user.id };
    console.log(`Client connected: ${user.name}`);
  }

  private async getAuthenticatedUser(uid: number): Promise<User> {
    if (!uid) {
      throw new UnauthorizedException('User not authenticated.');
    }
    const user = await this.chatService.getUser(uid);
    return user;
  }

  @UseGuards(ChannelAuthGuard)
  @SubscribeMessage('sendMessage')
  async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() data: CreateMessageDto): Promise<MessageDto> {
    const user = await this.getAuthenticatedUser(client.data.uid);
    const message = await this.chatService.createMessage(user, data.channelId, data.content);
    return {
      channelId: message.channel.id,
      content: message.content,
      user: {
        id: message.user.id,
        username: message.user.name,
      },
      timeStamp: message.timeStamp,
    };
  }
  
  /* ======= */
  /* Channel */
  /* ======= */
  @SubscribeMessage('createChannel')
  async createChannel(
    client: Socket,
     createGroupChannelDto: CreateChannelDto,
  ) {
    const user = await this.getAuthenticatedUser(client.data.uid);
    const channel = await this.chatService.createChannel(user, createGroupChannelDto);
    console.log('Channel created with ID:', channel.id);
    this.server.emit('channelEntered', { channelId: channel.id });
    console.log('entered:', channel);
    return channel;
  }

  @SubscribeMessage('joinChannel')
  async joinChannel(@ConnectedSocket() client: Socket, payload: any) {
    const user = await this.getAuthenticatedUser(client.data.uid);
    const channel = await this.chatService.validateChannelAndMember(user, payload.channelId);
    client.join('channel-${channel.id}');
    return channel;
  }
  
  @SubscribeMessage('enterChannel')
  @UseGuards(ChannelAuthGuard) 
  async enterChannel(@ConnectedSocket() client: Socket, payload: any) {
    const user = await this.getAuthenticatedUser(client.data.uid);
    const channel = await this.chatService.validateChannelAndMember(user, payload.channelId);
    this.server.emit('channelEntered', { channelId: channel.id });
    return channel;
  }

  @SubscribeMessage('exitChannel')
  async exitChannel(@ConnectedSocket() client: Socket, payload: any) {
    const user = await this.getAuthenticatedUser(client.data.uid);
    await this.chatService.exitChannel(user, payload.channelId);
    this.server.emit('deletedGroupChannel', {
      channelId: payload.channelId,
      user: {
        id: user.id,
        username: user.name,
      },
    });
  }

  @SubscribeMessage('getAllChannels')
  async getAllChannels(@ConnectedSocket() client: Socket, payload: any) {
    const channels = await this.chatService.getAllChannels();
    return channels;
  }

  @SubscribeMessage('getMyChannels')
  async getMyChannels(@ConnectedSocket() client: Socket, payload: any) {
    const user = await this.getAuthenticatedUser(client.data.uid);
    const channels = await this.chatService.getMyChannels(user);
    return channels;
  }

  @SubscribeMessage('getChannelMembers')
  async getChannelMembers(@ConnectedSocket() client: Socket, payload: any) {
    const members = await this.chatService.getChannelMembers(payload.channelId);
    return members;
  }

  /* ==== */
  /* Chat */
  /* ==== */
  @SubscribeMessage('createMessage')
  async createMessage(@ConnectedSocket() client: Socket, @MessageBody() data: CreateMessageDto) {
    const message = await this.chatService.createMessage(client.data.uid, data.channelId, data.content);
    const messageDto: MessageDto = {
      channelId: message.channel.id,
      content: message.content,
      user: {
        id: message.user.id,
        username: message.user.name,
      },
      timeStamp: message.timeStamp,
    };
    this.server.to(`channel-${message.channel.id}`).emit('newMessage', messageDto);
    return messageDto;
  }  
}
