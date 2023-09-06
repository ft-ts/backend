import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { ChannelService } from './channel.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { InvalidPasswordException, NotAuthorizedException, NotFoundException } from 'src/common/exceptions/chat.exception';
import { UseGuards } from '@nestjs/common';
import { AtGuard } from 'src/auth/auth.guard';
import { SocketService } from 'src/common/service/socket.service';

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

  @SubscribeMessage('channel/linkChannel')
  async linkChannel(@ConnectedSocket() client: Socket) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const userChannels = await this.channelService.getMyChannels(user);
    for (const channel of userChannels) {
      await client.join(`channel/channel-${channel.id}`);
    }
  }

  // async handleDisconnect(@ConnectedSocket() client: Socket) {
  //     const user = await this.channelService.getAuthenticatedUser(client.data.uid);
  //     const userChannels = await this.channelService.getMyChannels(user);
  //     for (const channel of userChannels) {
  //       await client.leave(`channel/channel-${channel.id}`);
  //     }
  // }

  /* ======= */
  /* Channel */
  /* ======= */
  @SubscribeMessage('channel/createChannel')
  async createChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() createGroupChannelDto: CreateChannelDto) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const channel = await this.channelService.createChannel(user, createGroupChannelDto);
    await this.server.emit('channel/channelUpdate', channel);
    await client.join(`channel/channel-${channel.id}`);
    await this.server.to(`channel/channel-${channel.id}`).emit('channel/createChannel', channel.id);
  }

  @SubscribeMessage('channel/enterChannel')
  async enterChannel(socket: Socket, payload: { channelId: number, uid: number, password: string }) {
  try {
    const { channelId, uid, password } = payload;
    const user = await this.channelService.getAuthenticatedUser(uid);
    const channel = await this.channelService.enterChannel(user, channelId, password);
    socket.emit('channel/enterChannel', { channel });
  } catch (error) {
    if (error instanceof NotFoundException) {
      socket.emit('channel/error', { message: 'Channel not found' });
    } else if (error instanceof NotAuthorizedException) {
      socket.emit('channel/error', { message: error.message });
    } else if (error instanceof InvalidPasswordException) {
      socket.emit('channel/error', { message: error.message });
    } else {
      socket.emit('channel/error', { message: 'Failed to enter channel' });
    }
  }
}
  @SubscribeMessage('channel/leaveChannel')
  async leaveChannel(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const channel = await this.channelService.getChannelById(payload.channelId);
    await this.channelService.leaveChannel(user, channel);
    await client.leave(`channel/channel-${payload.channelId}`);
    await this.server.emit('channel/channelUpdate', channel);
    await this.server.to(`channel/channel-${payload.channelId}`).emit('channel/leaveChannel', { channelId: payload.channelId, user: user.name });
  }

  @SubscribeMessage('channel/getAllChannels')
  async getAllChannels(@ConnectedSocket() client: Socket) {
    const channels = await this.channelService.getAllChannels();
    await client.emit('channel/getAllChannels', channels);
  }

  @SubscribeMessage('channel/getMyChannels')
  async getMyChannels(@ConnectedSocket() client: Socket) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const channels = await this.channelService.getMyChannels(user);
    await client.emit('channel/getMyChannels', channels);
    const userChannels = await this.channelService.getMyChannels(user);
    for (const channel of userChannels) {
      await client.join(`channel/channel-${channel.id}`);
    }
  }


  @SubscribeMessage('channel/getChannelById')
  async getChannelById(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const channel = await this.channelService.getChannelById(payload.channelId);
    await client.emit('channel/getChannelById', channel);
  }

  @SubscribeMessage('channel/editTitle')
  async editTitle(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const channel = await this.channelService.getChannelById(payload.channelId);
    await this.channelService.editTitle(user, channel , payload.title);
    await this.server.to(`channel/channel-${payload.channelId}`).emit('channel/channelUpdate', channel);
    console.log('editTitle', channel);
  }

  @SubscribeMessage('channel/editPassword')
  async editPassword(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const channel = await this.channelService.getChannelById(payload.channelId);
    await this.channelService.editPassword(user, channel , payload.password);
    await this.server.to(`channel/channel-${channel.id}`).emit('channel/editChannel', "password changed");
    await client.emit('channel/channelUpdate', channel.password);
  }

  @SubscribeMessage('channel/editMode')
  async editMode(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const channel = await this.channelService.getChannelById(payload.channelId);
    await this.channelService.editMode(user, payload.channelId , payload.mode, payload.password);
    await this.server.to(`channel/channel-${channel.id}`).emit('channel/channelUpdate', channel.mode);
  }

  /* ====== */
  /* Member */
  /* ====== */
  
  @SubscribeMessage('channel/getChannelMembers')
  async getChannelMembers(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const members = await this.channelService.getChannelMembers(payload.channelId);
    await client.emit('channel/getChannelMembers', members);
  }

  @SubscribeMessage('channel/getChannelUser')
  async getChannelUser(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const channelUser = await this.channelService.getChannelUser(client.data.uid, payload.channelId);
    await client.emit('channel/getChannelUser', channelUser);
  }

  @SubscribeMessage('channel/grantAdmin')
  async grantAdmin(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const targetUser = await this.channelService.getUserByUid(payload.targetUserUid);
    await this.channelService.grantAdmin(user, payload.channelId , targetUser.id);
    this.server.to(`channel/channel-${payload.channelId}`).emit('channel/updateMemberRole', { channelId: payload.channelId, targetUser: targetUser.name });
  }
  
  @SubscribeMessage('channel/revokeAdmin')
  async revokeAdmin(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const targetUser = await this.channelService.getUserByUid(payload.targetUserUid);
    await this.channelService.revokeAdmin(user, payload.channelId , targetUser.id);
    this.server.to(`channel/channel-${payload.channelId}`).emit('channel/updateMemberRole', { channelId: payload.channelId, targetUser: targetUser.name });
  }
  
  @SubscribeMessage('channel/muteMember')
  async muteMember(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const targetUser = await this.channelService.getUserByUid(payload.targetUserUid);
    await this.channelService.muteMember(user, payload.channelId , targetUser.uid);
    this.server.to(`channel/channel-${payload.channelId}`).emit('channel/updateMemberState', `${targetUser.name} is muted in the channel ${payload.channelId}`);
  }
  
  @SubscribeMessage('channel/banMember')
  async banMember(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const targetUser = await this.channelService.getUserByUid(payload.targetUserUid);
    await this.channelService.banMember(user, payload.channelId , targetUser);
    const targetUserSocket = await this.socketService.getSocket(payload.targetUserUid);
    if (!!targetUserSocket) {
      await targetUserSocket.emit('channel/updateMemberState', `You've been banned from the channel ${payload.channelId}`);
      await targetUserSocket.leave(`channel/channel-${payload.channelId}`);
    }
    this.server.to(`channel/channel-${payload.channelId}`).emit('channel/updateMemberState', { channelId: payload.channelId, targetUser: targetUser.name });
  }

  @SubscribeMessage('channel/unbanMember')
  async unbanMember(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const targetUser = await this.channelService.getUserByUid(payload.targetUserUid);
    await this.channelService.unbanMember(user, payload.channelId, targetUser);
    this.server.to(`channel/channel-${payload.channelId}`).emit('channel/updateMemberState', { channelId: payload.channelId, targetUser: targetUser.name });
  }
  
  @SubscribeMessage('channel/kickMember')
  async kickMember(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const targetUserSocket = await this.socketService.getSocket(payload.targetUserUid);
    if (!!targetUserSocket) {
      await targetUserSocket.emit('channel/updateMemberState', `You've been kicked from the channel ${payload.channelId}`);
      await targetUserSocket.leave(`channel/channel-${payload.channelId}`);
    }
    const targetUser = await this.channelService.getUserByUid(payload.targetUserUid);
    await this.channelService.kickMember(user, payload.channelId , targetUser);
    this.server.to(`channel/channel-${payload.channelId}`).emit('channel/updateMemberState', `${user.name} has been kicked from the channel ${payload.channelId}`);
  }
  
  @SubscribeMessage('channel/inviteUserToChannel')
  async inviteUserToChannel(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const targetUser = await this.channelService.getUserByUid(payload.targetUid);
    const channel = await this.channelService.getChannelById(payload.channelId);
    await this.channelService.inviteUserToChannel(user, channel , targetUser);
    const targetUserSocket = await this.socketService.getSocket(targetUser.uid);
    if (!!targetUserSocket) {
      console.log('inviteUserToChannel', targetUserSocket.data.uid);
      await targetUserSocket.join(`channel/channel-${payload.channelId}`);
    }
    await this.server.emit('channel/channelUpdate', channel);
    this.server.to(`channel/channel-${payload.channelId}`).emit('channel/inviteUserToChannel', { channelId: payload.channelId, inviter: user.name, invitee: targetUser.name });
  }
  
  /* ==== */
  /* Chat */
  /* ==== */
  @SubscribeMessage('channel/sendMessage')
  async createMessage(client: Socket, createMessageDto: CreateMessageDto) {
    const user = await this.channelService.getAuthenticatedUser(client.data.uid);
    const message = await this.channelService.createMessage(user, createMessageDto);
    await this.server.to(`channel/channel-${createMessageDto.channelId}`).emit('channel/sendMessage', message);
  }

  @SubscribeMessage('channel/getChannelMessages')
  async getChannelMessages(@ConnectedSocket() client: Socket, @MessageBody() payload: any) {
    const channel = await this.channelService.getChannelById(payload.channelId);
    const messages = await this.channelService.getChannelMessages(channel);
    await client.emit('channel/getChannelMessages', messages);
  }
}
