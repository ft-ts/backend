import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { Logger, UseGuards } from '@nestjs/common';
import { AtGuard } from 'src/auth/auth.guard';
import { SocketService } from 'src/common/service/socket.service';
import { UserStatus } from './user/enums/userStatus.enum';

@UseGuards(AtGuard)
@WebSocketGateway({
  cors: {
    origin: true,
  },
})
export class AppGateway 
implements OnGatewayConnection, OnGatewayDisconnect{
  constructor(
    private readonly authService: AuthService,
    private readonly socketService: SocketService,
  ) { }

  @WebSocketServer()
  server: Server;

  async handleConnection(client: Socket) {
    if (!(await this.authService.validateSocket(client))) {
      client.disconnect();
      return;
    }
    console.log('😭 app/handleConnection', client.data);
    await this.socketService.addSocket(client.data.uid, client);
    await client.join(`dm-${client.data.uid}`);
    this.server.emit('update/userConnection', {uid : client.data.uid, status: UserStatus.ONLINE});
    Logger.debug(`[AppGateway] ${client.data.uid} joined 'dm-${client.data.uid}'`);
  }

  async handleDisconnect(client: Socket) {
    Logger.debug(`[AppGateway] ${client.data.uid} disconnected`);
    await this.socketService.removeSocket(client.data.uid);
    await this.authService.handleUserStatus(client.data.uid, false);
    this.server.emit('update/userConnection', {uid: client.data.uid, status: UserStatus.OFFLINE});
  }
  
  @SubscribeMessage('update/userInfo')
  async updateMyInfo(
    @ConnectedSocket() client: Socket,
  ) {
    Logger.debug(`[AppGateway] test123 ${client.data.uid}`);
    this.server.emit('update/userInfo');
  }

  @SubscribeMessage('update/channelInfo')
  async updateChannelInfo(
    @ConnectedSocket() client: Socket,
  ) {
    this.server.emit('update/channelInfo');
  }

  @SubscribeMessage('update/friends')
  async updateFriends(
    @ConnectedSocket() client: Socket,
  ) {
    client.emit('update/friends');
  }
}
