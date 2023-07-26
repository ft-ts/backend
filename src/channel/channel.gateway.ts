import { ConnectedSocket, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { ChannelService } from './channel.service';
import { UnauthorizedException } from 'src/common/exceptions/authorization.execption';
import { CreateGroupChannelDto } from './dto/create-channel.dto';

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
    console.log('New client connected');
    const isValid = await this.authService.validateSocket(client);
    if (!isValid) {
      client.disconnect(true);
      return;
    }
  }

  @SubscribeMessage('createGroupChannel')
  async createGroupChannel(
    @ConnectedSocket() client: Socket,
    createGroupChannelDto: CreateGroupChannelDto,
  ) {
    // Get user data from the socket
    const user = await this.chatService.getUser(client);
    if (!user) {
      throw new UnauthorizedException('User not authenticated.');
    }

    // Call your channel service method with the authenticated user
    const channel = await this.chatService.createGroupChannel(
      user,
      createGroupChannelDto,
    );

    // Emit the new channel data to all clients
    this.server.emit('newGroupChannel', channel);

    return channel;
  }


  @SubscribeMessage('exitGroupChannel')
  async exitGroupChannel(@ConnectedSocket() client: Socket, payload: any) {
    const user = client.data.user;
    const channel = await this.chatService.exitGroupChannel(user, payload.channelId);
    this.server.emit('deletedGroupChannel', channel);

    return channel;
  }

  @SubscribeMessage('getAllGroupChannels')
  async getAllGroupChannels(@ConnectedSocket() client: Socket, payload: any) {
    const channels = await this.chatService.getAllGroupChannels();
    return channels;
  }

  @SubscribeMessage('getMyGroupChannels')
  async getMyGroupChannels(@ConnectedSocket() client: Socket, payload: any) {
    const user = client.data.user;
    const channels = await this.chatService.getMyGroupChannels(user);
    return channels;
  }

  @SubscribeMessage('getGroupChannelById')
  async getGroupChannelById(@ConnectedSocket() client: Socket, payload: any) {
    const channel = await this.chatService.getGroupChannelById(payload.channelId);
    return channel;
  }

  @SubscribeMessage('enterGroupChannel')
  async enterGroupChannel(@ConnectedSocket() client: Socket, payload: any) {
    const user = client['user'];
    const channel = await this.chatService.enterGroupChannel(user, payload.channelId, payload.password);
    return channel;
  }

  @SubscribeMessage('getChannelMembers')
  async getChannelMembers(@ConnectedSocket() client: Socket, payload: any) {
    const members = await this.chatService.getChannelMembers(payload.channelId);
    return members;
  }


}
