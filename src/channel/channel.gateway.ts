import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { ChannelService } from './channel.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { CreateMessageDto } from './dto/create-message.dto';

interface UserSocketMap {
  [userUid: number]: Socket;
}

@WebSocketGateway({
  namespace: 'channels', 
  cors: {
    origin: true,
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
    if (!(await this.authService.validateSocket(client))) {
      client.disconnect();
      return;
    }
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const userChannels = await this.channelService.getMyChannels(user);
    this.userSocketMap[client.data.uid] = client;
    for (const channel of userChannels) {
      await client.join(`channel-${channel.id}`);
    }
    console.log('handleConnection Channel', user.name, client.data.uid);
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
      if (!(await this.authService.validateSocket(client))) {
        client.disconnect();
        return;
      }
      const user = await this.channelService.getAuthenticatedUser(client.data.uid);
      const userChannels = await this.channelService.getMyChannels(user);
      for (const channel of userChannels) {
        await client.leave(`channel-${channel.id}`);
      }
    console.log('handleDisconnect', user.name, client.data.uid);
    delete this.userSocketMap[client.data.uid];
  }

  /* ======= */
  /* Channel */
  /* ======= */
  @SubscribeMessage('createChannel')
  async createChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() createGroupChannelDto: CreateChannelDto) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const channel = await this.channelService.createChannel(user, createGroupChannelDto);
    await client.join(`channel-${channel.id}`);
    await this.server.to(`channel-${channel.id}`).emit('createChannel', channel);
    console.log('createChannel', user.name, channel.id);
  }

  @SubscribeMessage('enterChannel')
  async enterChannel(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const channel = await this.channelService.enterChannel(user, payload.channelId, payload.password);
    await client.join(`channel-${channel.id}`);
    this.server.to(`channel-${channel.id}`).emit('enterChannel', { channelId: channel.id, user: user.name });
  }

  @SubscribeMessage('leaveChannel')
  async leaveChannel(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const channel = await this.channelService.getChannelById(payload.channelId);
    await this.channelService.leaveChannel(user, channel);
    await client.leave(`channel-${payload.channelId}`);
    await this.server.to(`channel-${payload.channelId}`).emit('leaveChannel', { channelId: payload.channelId, user: user.name });
  }

  @SubscribeMessage('getAllChannels')
  async getAllChannels(@ConnectedSocket() client: Socket) {
    const channels = await this.channelService.getAllChannels();
    console.log('getAllChannels', channels);
    
    await client.emit('getAllChannels', channels);
  }

  @SubscribeMessage('getMyChannels')
  async getMyChannels(@ConnectedSocket() client: Socket) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const channels = await this.channelService.getMyChannels(user);
    await client.emit('getMyChannels', channels);
  }


  @SubscribeMessage('getChannelById')
  async getChannelById(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const channel = await this.channelService.getChannelById(payload.channelId);
    await client.emit('getChannelById', channel);
  }

  @SubscribeMessage('editTitle')
  async editTitle(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const channel = await this.channelService.getChannelById(payload.channelId);
    await this.channelService.editTitle(user, channel , payload.title);
    await this.server.to(`channel-${payload.channelId}`).emit('editChannel', channel);
  }

  @SubscribeMessage('editPassword')
  async editPassword(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const channel = await this.channelService.getChannelById(payload.channelId);
    await this.channelService.editPassword(user, channel , payload.password);
    await this.server.to(`channel-${channel.id}`).emit('editChannel', "password changed");
    await client.emit('editChannel', channel.password);
  }

  @SubscribeMessage('editMode')
  async editMode(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const channel = await this.channelService.getChannelById(payload.channelId);
    await this.channelService.editMode(user, payload.channelId , payload.mode, payload.password);
    await this.server.to(`channel-${channel.id}`).emit('editChannel', channel.mode);
  }

  /* ====== */
  /* Member */
  /* ====== */
  
  @SubscribeMessage('getChannelMembers')
  async getChannelMembers(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const members = await this.channelService.getChannelMembers(payload.channelId);
    await client.emit('getChannelMembers', members);
  }

  @SubscribeMessage('grantAdmin')
  async grantAdmin(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const targetUser = await this.channelService.getUserByUid(payload.targetUserUid);
    await this.channelService.grantAdmin(user, payload.channelId , targetUser.id);
    this.server.to(`channel-${payload.channelId}`).emit('updateMemberRole', { channelId: payload.channelId, targetUser: targetUser.name });
  }
  
  @SubscribeMessage('revokeAdmin')
  async revokeAdmin(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const targetUser = await this.channelService.getUserByUid(payload.targetUserUid);
    await this.channelService.revokeAdmin(user, payload.channelId , targetUser.id);
    this.server.to(`channel-${payload.channelId}`).emit('updateMemberRole', { channelId: payload.channelId, targetUser: targetUser.name });
  }
  
  @SubscribeMessage('muteMember')
  async muteMember(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const targetUser = await this.channelService.getUserByUid(payload.targetUserUid);
    await this.channelService.muteMember(user, payload.channelId , targetUser.uid);
    this.server.to(`channel-${payload.channelId}`).emit('updateMemberState', `${targetUser.name} is muted in the channel ${payload.channelId}`);
  }
  
  @SubscribeMessage('banMember')
  async banMember(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const targetUser = await this.channelService.getUserByUid(payload.targetUserUid);
    await this.channelService.banMember(user, payload.channelId , targetUser);
    const targetUserSocket = this.userSocketMap[payload.targetUserUid];
    if (!!targetUserSocket) {
      await targetUserSocket.emit('updateMemberState', `You've been banned from the channel ${payload.channelId}`);
      await targetUserSocket.leave(`channel-${payload.channelId}`);
    }
    this.server.to(`channel-${payload.channelId}`).emit('updateMemberState', { channelId: payload.channelId, targetUser: targetUser.name });
  }

  @SubscribeMessage('unbanMember')
  async unbanMember(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const targetUser = await this.channelService.getUserByUid(payload.targetUserUid);
    await this.channelService.unbanMember(user, payload.channelId, targetUser);
    this.server.to(`channel-${payload.channelId}`).emit('updateMemberState', { channelId: payload.channelId, targetUser: targetUser.name });
  }
  
  @SubscribeMessage('kickMember')
  async kickMember(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const targetUserSocket = this.userSocketMap[payload.targetUserUid];
    if (!!targetUserSocket) {
      await targetUserSocket.emit('updateMemberState', `You've been kicked from the channel ${payload.channelId}`);
      await targetUserSocket.leave(`channel-${payload.channelId}`);
    }
    const targetUser = await this.channelService.getUserByUid(payload.targetUserUid);
    await this.channelService.kickMember(user, payload.channelId , targetUser);
    this.server.to(`channel-${payload.channelId}`).emit('updateMemberState', `${user.name} has been kicked from the channel ${payload.channelId}`);
  }
  
  @SubscribeMessage('inviteUserToChannel')
  async inviteUserToChannel(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const targetUser = await this.channelService.getUserByUid(payload.targetUid);
    await this.channelService.inviteUserToChannel(user, payload.channelId , targetUser);
    const targetUserSocket = await this.userSocketMap[targetUser.uid];
    if (!!targetUserSocket) {
      console.log('inviteUserToChannel', targetUserSocket.data.uid);
      await targetUserSocket.join(`channel-${payload.channelId}`);
    }
    this.server.to(`channel-${payload.channelId}`).emit('inviteUserToChannel', { channelId: payload.channelId, inviter: user.name, invitee: targetUser.name });
  }
  
  /* ==== */
  /* Chat */
  /* ==== */
  @SubscribeMessage('sendMessage')
  async createMessage(client: Socket, createMessageDto: CreateMessageDto) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const message = await this.channelService.createMessage(user, createMessageDto);
    this.server.to(`channel-${createMessageDto.channelId}`).emit('sendMessage', message);
  }

  @SubscribeMessage('getChannelMessages')
  async getChannelMessages(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const messages = await this.channelService.getChannelMessages(payload.channelId);
    await client.emit('getChannelMessages', messages);
  }
}
