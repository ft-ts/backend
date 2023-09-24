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
import { Repository } from 'typeorm';
import { Block } from 'src/user/entities/block.entity';
import { InjectRepository } from '@nestjs/typeorm';

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
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
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

  @SubscribeMessage('channel/join')
  async join(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: {channelId: number, password: string}){
      let channel: Channel;
      const user: User | null = await this.channelService.getUserByUid(client.data.uid);
      const isMember = await this.channelService.isChannelMember(user, payload.channelId);
      if (!user) return ;
      try {
        channel = await this.channelService.enterChannel(user, payload);
      } catch (error) {
          client.emit('channel/join/fail', { message: error.message });
          return ;
      }
      client.join(`channel/channel-${payload.channelId}`);
      client.emit('channel/join/success', channel);
      if (!isMember) {
        client.emit('channel/join/new', channel);
      }
  }

  @SubscribeMessage('channel/leaveChannel')
  async leaveChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: {channelId: number})
  {
    const user: User | null = await this.channelService.getUserByUid(client.data.uid);
    const channel: Channel | null = await this.channelService.getChannelById(payload.channelId);
    if (!user || !channel) return ;
    this.channelService.leaveChannel(client.data.uid, channel);
    await client.leave(`channel/channel-${payload.channelId}`);
    this.server.to(`channel/channel-${payload.channelId}`).emit('channel/innerUpdate');
    this.server.emit('update/channelInfo');
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

    // const blockedUsers = await this.blockRepository.find({
    //   where: { user: { uid: user.uid } },
    //   relations: ['blocked'],
    // });
    // const blockedUserIds = blockedUsers.map((blockedUser) => blockedUser.blocked.uid);

    // const members = await this.channelService.getChannelMembers(createMessageDto.channelId);
    // const memberUids = members.map((member) => member.user.uid);

    const message = await this.channelService.createMessage(user, createMessageDto);
    const res = {
      id: message.id,
      channel_id: message.channel.id,
      isNotice: message.isNotice,
      sender_uid: message.sender_uid,
      content: message.content,
      timeStamp: message.timeStamp,
    }

    // for (const memberUid of memberUids) {
    //   const memberSocket = await this.socketService.getSocket(memberUid);
    //   if (memberSocket) {
    //     memberSocket.leave(`channel/channel-${createMessageDto.channelId}`);
    //   }
    // }
    this.server.to(`channel/channel-${createMessageDto.channelId}`).emit('channel/sendMessage', res);
  }

  @SubscribeMessage('channel/innerUpdate')
  async channelInnerUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: {channelId: number},
  ) {
    this.server.to(`channel/channel-${payload.channelId}`).emit('channel/innerUpdate');
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


