import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { ChannelService } from './channel.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { ChannelUserGuard } from './guards/channel-user.guard';
import { UseGuards } from '@nestjs/common';

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

  async handleConnection(client: Socket) {
    const payload = await this.authService.validateToken(client.handshake.headers.authorization);
    if (!payload) {
      client.disconnect(true);
      return;
    }
    const user = await this.channelService.getAuthenticatedUser(payload.uid);
    if (!user) {
      client.disconnect(true);
      return;
    }
    client.data = { uid: user.uid };
    console.log(`Client connected: ${user.name}`);
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
    console.log('Channel created with ID:', channel.id);
    this.server.emit('channelEntered', { channelId: channel.id });
    console.log('entered:', channel);
    return channel;
  }

  @SubscribeMessage('enterChannel')
  async enterChannel(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const channel = await this.channelService.enterChannel(user, payload.channelId, payload.password);
    await client.join(`channel-${channel.id}`);
    this.server.emit('channelEntered', { channel: channel });
    return channel;
  }
  

  @SubscribeMessage('leaveChannel')
  async leaveChannel(@ConnectedSocket() client: Socket, payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    await this.channelService.leaveChannel(user, payload.channelId);
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
    const channels = await this.channelService.getAllChannels();
    this.server.emit('getAllChannels', channels);
    return channels;
  }

  @SubscribeMessage('getMyChannels')
  async getMyChannels(@ConnectedSocket() client: Socket, payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const channels = await this.channelService.getMyChannels(user);
    this.server.emit('getMyChannels', channels);
    return channels;
  }

  @SubscribeMessage('getChannelMembers')
  async getChannelMembers(@ConnectedSocket() client: Socket, payload: any) {
    const members = await this.channelService.getChannelMembers(payload.channelId);
    return members;
  }

  /* ====== */
  /* Member */
  /* ====== */

  // @UseGuards(ChannelUserGuard)
  @SubscribeMessage('getMembers')
  async getMembers(@ConnectedSocket() client: Socket, payload: any) {
    const members = await this.channelService.getMembers(payload.channelId);
    return members;
  }

  // @UseGuards(ChannelUserGuard)
  @SubscribeMessage('grantAdmin')
  async grantAdmin(@ConnectedSocket() client: Socket, payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    await this.channelService.grantAdmin(user, payload.channelId , payload.targetUserId);
  }

  // @UseGuards(ChannelUserGuard)
  @SubscribeMessage('revokeAdmin')
  async revokeAdmin(@ConnectedSocket() client: Socket, payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    await this.channelService.revokeAdmin(user, payload.channelId , payload.targetUserId);
  }

  // @UseGuards(ChannelUserGuard)
  @SubscribeMessage('muteMember')
  async muteMember(@ConnectedSocket() client: Socket, payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    await this.channelService.muteMember(user, payload.channelId , payload.targetUserId);
  }

  // @UseGuards(ChannelUserGuard)
  @SubscribeMessage('banMember')
  async banMember(@ConnectedSocket() client: Socket, payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    await this.channelService.banMember(user, payload.channelId , payload.targetUserId);
  }

  // @UseGuards(ChannelUserGuard)
  @SubscribeMessage('unbanMember')
  async unbanMember(@ConnectedSocket() client: Socket, payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    await this.channelService.unbanMember(user, payload.channelId , payload.targetUserId);
  }

  // @UseGuards(ChannelUserGuard)
  @SubscribeMessage('kickMember')
  async kickMember(@ConnectedSocket() client: Socket, payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    await this.channelService.kickMember(user, payload.channelId , payload.targetUserId);
  }

  // @UseGuards(ChannelUserGuard)
  @SubscribeMessage('editTitle')
  async editTitle(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const channel = await this.channelService.editTitle(user, payload.channelId , payload.title);
    this.server.emit('editChannel', channel);
  }

  // @UseGuards(ChannelUserGuard)
  @SubscribeMessage('editPassword')
  async editPassword(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const channel = await this.channelService.editPassword(user, payload.channelId , payload.password);
    this.server.emit('editChannel', channel);
  }

  // @UseGuards(ChannelUserGuard)
  @SubscribeMessage('editMode')
  async editMode(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const channel = await this.channelService.editMode(user, payload.channelId , payload.mode, payload.password);
    this.server.emit('editChannel', channel);
  }


  /* ==== */
  /* Chat */
  /* ==== */

  // @UseGuards(ChannelUserGuard)
  @SubscribeMessage('sendMessage')
  async createMessage(@ConnectedSocket() client: Socket, @MessageBody() data: CreateMessageDto) {
    const message = await this.channelService.createMessage(client.data.uid, data.channelId, data.content);
    this.server.to(`channel-${data.channelId}`).emit('newMessage', message);
    return message;
  }
}
