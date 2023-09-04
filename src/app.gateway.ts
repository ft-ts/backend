import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { Logger, UseGuards } from '@nestjs/common';
import { AtGuard } from 'src/auth/auth.guard';
import { SocketService } from 'src/common/service/socket.service';

@UseGuards(AtGuard)
@WebSocketGateway({
  cors: {
    origin: true,
  },
})
export class AppGateway {
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
    Logger.debug(`[AppGateway] ${client.data.uid} joined 'dm-${client.data.uid}'`);
  }

  async handleDisconnect(client: Socket) {
    Logger.debug(`[AppGateway] ${client.data.uid} disconnected`);
    await this.socketService.removeSocket(client.data.uid);
    this.authService.handleUserStatus(client.data.uid, false);
  }
}
