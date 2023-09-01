import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { Logger, UseGuards } from '@nestjs/common';
import { AtGuard } from 'src/auth/auth.guard';

@UseGuards(AtGuard)
@WebSocketGateway({
  cors: {
    origin: true,
  },
})
export class AppGateway {
  constructor(
    private readonly authService: AuthService,
  ) { }

  @WebSocketServer()
  server: Server;

  async handleConnection(client: Socket) {
    if (!(await this.authService.validateSocket(client))) {
      client.disconnect();
      return;
    }
    console.log('😭 app/handleConnection', client.data);
    await client.join(`dm-${client.data.uid}`);
    Logger.debug(`[AppGateway] ${client.data.uid} joined 'dm-${client.data.uid}'`);
  }

  async handleDisconnect(client: Socket) {
    Logger.debug(`[AppGateway] ${client.data.uid} disconnected`);
    this.authService.handleUserStatus(client.data.uid, false);
  }
}
