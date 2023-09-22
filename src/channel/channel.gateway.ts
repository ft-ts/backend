import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { ChannelService } from './channel.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { InvalidPasswordException, NotAMemberException, NotAuthorizedException, NotFoundException } from 'src/common/exceptions/chat.exception';
import { SocketService } from 'src/common/service/socket.service';
import { User } from 'src/user/entities/user.entity';
import { UseGuards } from '@nestjs/common';
import { AtGuard } from 'src/auth/auth.guard';
import { Channel } from './entities/channel.entity';
@UseGuards(AtGuard)
@WebSocketGateway({
  cors: {
    origin: true,
  },
})

export class ChannelGateway {
  constructor(
    private readonly channelService: ChannelService,
    private readonly socketService: SocketService,
  ) { }

  @WebSocketServer()
  server: Server;

  async handleConnection(@ConnectedSocket() client: Socket) {
    const user: User | null = await this.channelService.getUserByUid(client.data.uid);
    if (!user) return ;
    const userChannels = await this.channelService.getMyChannels(user);
    for (const channel of userChannels) {
      await client.join(`channel/channel-${channel.id}`);
    }
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const user: User | null = await this.channelService.getUserByUid(client.data.uid);
    if (!user) return ;
    const userChannels = await this.channelService.getMyChannels(user);
    for (const channel of userChannels) {
      await client.leave(`channel/channel-${channel.id}`);
    }
  }

  /* ======= */
  /* Channel */
  /* ======= */

  @SubscribeMessage('channel/join')
  async join(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: {channelId: number, password: string}){
      let channel: Channel;
      const user: User | null = await this.channelService.getUserByUid(client.data.uid);
      if (!user) return ;
      try {
        channel = await this.channelService.enterChannel(user, payload);
      } catch (error) {
        if (error instanceof NotAuthorizedException) {
          client.emit('channel/join/fail', { message: error.message });
        } else if (error instanceof InvalidPasswordException) {
          client.emit('channel/join/fail', { message: error.message });
        } else {
          client.emit('channel/join/fail', { message: error.message });
        }
        return ;
      }
      await client.join(`channel/channel-${payload.channelId}`);
      client.emit('channel/join/success', channel);
  }

  @SubscribeMessage('channel/leaveChannel')
  async leaveChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: {channelId: number})
  {
    const user: User | null = await this.channelService.getUserByUid(client.data.uid);
    const channel: Channel | null = await this.channelService.getChannelById(payload.channelId);
    if (!user || !channel) return ;
    await this.channelService.leaveChannel(user, channel);
    await this.server.to(`channel/channel-${payload.channelId}`).emit('channel/userLeft', { chId: channel.id, user: user.name });
    await client.leave(`channel/channel-${payload.channelId}`);
    await this.server.emit('channel/channelUpdate', channel);
  }

  @SubscribeMessage('channel/editTitle')
  async editTitle(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any
  ) {
    const user: User | null = await this.channelService.getUserByUid(client.data.uid);
    const channel: Channel | null = await this.channelService.getChannelById(payload.channelId);
    if (!user || !channel) return ;
    await this.channelService.editTitle(user, channel , payload.title);
    await this.server.emit('channel/channelUpdate', channel);
    console.log('editTitle', channel);
  }

  @SubscribeMessage('channel/editPassword')
  async editPassword(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any
  ) {
    const user: User | null = await this.channelService.getUserByUid(client.data.uid);
    const channel: Channel | null = await this.channelService.getChannelById(payload.channelId);
    if (!user || !channel) return ;
    await this.channelService.editPassword(user, channel , payload.password);
    await this.server.emit('channel/editChannel', "password changed");
    await client.emit('channel/channelUpdate', channel.password);
  }

  @SubscribeMessage('channel/editMode')
  async editMode(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any
  ) {
    const user: User | null = await this.channelService.getUserByUid(client.data.uid);
    const channel: Channel | null = await this.channelService.getChannelById(payload.channelId);
    if (!user || !channel) return ;
    await this.channelService.editMode(user, payload.channelId , payload.mode, payload.password);
    await this.server.emit('channel/channelUpdate', channel.mode);
  }
  
  /* ==== */
  /* Chat */
  /* ==== */
  @SubscribeMessage('channel/sendMessage')
  async createMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() createMessageDto: CreateMessageDto,
  ) {
    const user: User | null = await this.channelService.getUserByUid(client.data.uid);
    if (!user) return ;
    const message = await this.channelService.createMessage(user, createMessageDto);
    const res = {
      id: message.id,
      channel_id: message.channel.id,
      isNotice: message.isNotice,
      sender_uid: message.sender_uid,
      content: message.content,
      timeStamp: message.timeStamp,
    }
    await this.server.to(`channel/channel-${createMessageDto.channelId}`).emit('channel/sendMessage', res);
  }

  @SubscribeMessage('channel/sendNotification')
  async sendNotification(
    @ConnectedSocket() client: Socket,
    @MessageBody() createMessageDto: CreateMessageDto,
  ) {
    const messages = await this.channelService.sendNotification(createMessageDto);
    console.log('sendNotification', messages)
    await this.server.to(`channel/channel-${createMessageDto.channelId}`).emit('channel/sendMessage', messages);
  }
}


