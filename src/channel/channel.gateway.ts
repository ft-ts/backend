import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { ChannelService } from './channel.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { CreateMessageDto } from './dto/create-message.dto';

interface UserSocketMap {
  [userId: string]: Socket;
}

@WebSocketGateway({
  namespace: 'channels', 
  cors: {
    origin: process.env.FRONT_PORT,
  },
})
export class ChannelGateway {
  constructor(
    private readonly channelService: ChannelService,
    private readonly authService: AuthService,
  ) { }

  @WebSocketServer()
  server: Server;

  private userSocketMap: UserSocketMap = {};

  async handleConnection(@ConnectedSocket() client: Socket) {
    const payload = await this.authService.validateSocket(client);
    if (!payload) {
      client.disconnect();
      return;
    }
    if (client.data.uid) {
      this.userSocketMap[client.data.uid] = client;
    }
  }

  /* ======= */
  /* Channel */
  /* ======= */
  @SubscribeMessage('createChannel')
  async createChannel(
    client: Socket,
     createGroupChannelDto: CreateChannelDto,
  ) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const channel = await this.channelService.createChannel(user, createGroupChannelDto);
    await client.join(`channel-${channel.id}`);
    this.server.emit('createChannel', channel);
    return channel;
  }

  @SubscribeMessage('enterChannel')
  async enterChannel(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const channel = await this.channelService.enterChannel(user, payload.channelId, payload.password);
    console.log('channel.id: ', channel);
    await client.join(`channel-${channel.id}`);
    this.server.to(`channel-${channel.id}`).emit('enterChannel', { channelId: channel.id, userId: user.id });
  }

  @SubscribeMessage('leaveChannel')
  async leaveChannel(@ConnectedSocket() client: Socket, payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    await this.channelService.leaveChannel(user, payload.channelId);
    this.server.to(`channel-${payload.channelId}`).emit('leaveChannel', { channelId: payload.channelId, userId: user.uid });
    await client.leave(`channel-${payload.channelId}`);

  }

  @SubscribeMessage('getAllChannels')
  async getAllChannels(@ConnectedSocket() client: Socket, payload: any) {
    const channels = await this.channelService.getAllChannels();
    this.server.emit('getAllChannels', channels);
    return channels;
  }

  @SubscribeMessage('getMyChannels')
  async getMyChannels(@ConnectedSocket() client: Socket) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const channels = await this.channelService.getMyChannels(user);
    this.server.emit('getMyChannels', channels);
    return channels;
  }

  @SubscribeMessage('editTitle')
  async editTitle(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const channel = await this.channelService.editTitle(user, payload.channelId , payload.title);
    this.server.emit('editChannel', channel);
  }

  @SubscribeMessage('editPassword')
  async editPassword(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const channel = await this.channelService.editPassword(user, payload.channelId , payload.password);
    this.server.emit('editChannel', channel);
  }

  @SubscribeMessage('editMode')
  async editMode(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const channel = await this.channelService.editMode(user, payload.channelId , payload.mode, payload.password);
    this.server.emit('editChannel', channel);
  }

  /* ====== */
  /* Member */
  /* ====== */

  @SubscribeMessage('getChannelMembers')
  async getChannelMembers(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const members = await this.channelService.getChannelMembers(payload.channelId);
    this.server.emit('getChannelMembers', members);
    return members;
  }

  @SubscribeMessage('grantAdmin')
  async grantAdmin(@ConnectedSocket() client: Socket, payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    await this.channelService.grantAdmin(user, payload.channelId , payload.targetUserId);
  }

  @SubscribeMessage('revokeAdmin')
  async revokeAdmin(@ConnectedSocket() client: Socket, payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    await this.channelService.revokeAdmin(user, payload.channelId , payload.targetUserId);
  }

  @SubscribeMessage('muteMember')
  async muteMember(@ConnectedSocket() client: Socket, payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    await this.channelService.muteMember(user, payload.channelId , payload.targetUserId);
  }

  @SubscribeMessage('banMember')
  async banMember(@ConnectedSocket() client: Socket, payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    await this.channelService.banMember(user, payload.channelId , payload.targetUserId);
  }

  @SubscribeMessage('unbanMember')
  async unbanMember(@ConnectedSocket() client: Socket, payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    await this.channelService.unbanMember(user, payload.channelId , payload.targetUserId);
  }

  @SubscribeMessage('kickMember')
  async kickMember(@ConnectedSocket() client: Socket, payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    await this.channelService.kickMember(user, payload.channelId , payload.targetUserId);
    const targetUserSocket = this.server.sockets.sockets.get(payload.targetUserId);
    if (targetUserSocket) {
      targetUserSocket.leave(`channel-${payload.channelId}`);
      targetUserSocket.emit('kickChannel', { channelId: payload.channelId, userId: payload.targetUserId });
    }

  }

  @SubscribeMessage('inviteUserToChannel')
  async inviteUserToChannel(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const targetUser = await this.channelService.getUserByUid(payload.targetUid);

    // await this.channelService.inviteUserToChannel(user, payload.channelId , targetUser);
    const targetUserSocket = this.userSocketMap[payload.targetUid];


    console.log('targetUserSocket', targetUserSocket)

    // if (targetUserSocket) {
    //   targetUserSocket.join(`channel-${payload.channelId}`);
    //   targetUserSocket.emit('enterChannel', { channelId: payload.channelId, userId: payload.targetId });
    // }
    this.server.emit('inviteUserToChannel', targetUser);
  }


  /* ==== */
  /* Chat */
  /* ==== */

  // @UseGuards(ChannelUserGuard)
  @SubscribeMessage('sendMessage')
  async createMessage(@ConnectedSocket() client: Socket, @MessageBody() data: CreateMessageDto) {
    const message = await this.channelService.createMessage(client.data.uid, data.channelId, data.content);
    this.server.to(`channel-${data.channelId}`).emit('sendMessage', message);
    return message;
  }
}
