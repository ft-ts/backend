import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChannelService } from './channel.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { InvalidPasswordException, NotAMemberException, NotAuthorizedException, NotFoundException } from 'src/common/exceptions/chat.exception';
import { SocketService } from 'src/common/service/socket.service';
import { User } from 'src/user/entities/user.entity';
import { UseGuards } from '@nestjs/common';
import { AtGuard } from 'src/auth/auth.guard';
import { Channel } from './entities/channel.entity';
import { ChannelRole } from './enum/channelRole.enum';

@UseGuards(AtGuard)
@WebSocketGateway({
  cors: {
    origin: true,
  },
})

export class ChannelGateway 
implements OnGatewayConnection, OnGatewayDisconnect{
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

  @SubscribeMessage('channel/invite/accept')
  async acceptInvite(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: {channelId: number, targetUid: number}) {
      const targetUserSocket = await this.socketService.getSocket(payload.targetUid);
      const channel: Channel = await this.channelService.getChannelById(payload.channelId);
      if (!channel || !targetUserSocket) {
        return ;
      }
      await targetUserSocket.join(`channel/channel-${channel.id}`);
  }

  /* ======= */
  /* Channel */
  /* ======= */

  @SubscribeMessage('channel/leaveChannel')
  async leaveChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: {channelId: number, targetUserUid: number|null})
  {
    await client.leave(`channel/channel-${payload.channelId}`);
    this.server.to(`channel/channel-${payload.channelId}`).emit('channel/innerUpdate', {channelId: payload.channelId, targetUserUid: payload.targetUserUid});
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
    if (!user) throw new NotFoundException('User not found');
    const message = await this.channelService.createMessage(user, createMessageDto);
    const res = {
      id: message.id,
      channel_id: message.channel.id,
      isNotice: message.isNotice,
      sender: message.sender,
      content: message.content,
      timeStamp: message.timeStamp,
    }
    this.server.to(`channel/channel-${createMessageDto.channelId}`).emit('channel/sendMessage', res);
  }

  @SubscribeMessage('channel/innerUpdate')
  async channelInnerUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: {channelId: number},
  ) {
    this.server.to(`channel/channel-${payload.channelId}`).emit('channel/innerUpdate', payload.channelId);
  }

  @SubscribeMessage('channel/joinUpdate')
  async channelJoinUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: {channelId: number},
  ) {
    console.log('joinUpdate');
    this.server.to(`channel/channel-${payload.channelId}`).emit('channel/joinUpdate', {channelId:payload.channelId});
  }

  @SubscribeMessage('channel/leaveUpdate')
  async channelLeaveUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: {channelId: number, targetUid: number|null, granted: ChannelRole|null},
  ) {
    console.log('leaveUpdate');
    this.server.to(`channel/channel-${payload.channelId}`).emit('channel/leaveUpdate', {channelId:payload.channelId, targetUid: payload.targetUid, granted: payload.granted});
  }

  @SubscribeMessage('channel/chatRoomUpdate')
  async chatRoomUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: {channelId: number},
  ) {
    const channel = await this.channelService.getChannelById(payload.channelId);
    this.server.to(`channel/channel-${payload.channelId}`).emit('channel/chatRoomUpdate', channel);
  }
}


