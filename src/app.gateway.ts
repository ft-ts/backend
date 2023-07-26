import { Logger, UseFilters, UsePipes } from "@nestjs/common";
import { SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';
import { UserStatus } from "./user/enums/userStatus.enum";
import { AuthService } from "./auth/auth.service";

@WebSocketGateway({
  cors: {
    origin: process.env.FRONT_PORT,
  },
})
// @UsePipes(new WsValidationPipe())
// @UseFilters(new WsExceptionFilter())
export class AppGateway {
  constructor(private readonly authService: AuthService) {}

  private sockets = new Set();
  @WebSocketServer()
  server: Server;

  async handleConnection(client: Socket) {
    try {
      await this.validateUser(client);
    } catch (e) {
      console.log(e.error);
      client.disconnect();
    }

    if (client.data.uid === undefined) return;
    client.join(`dm${client.data.uid}`);
    console.log(
      `socketInit: ${client.data.uid} connected dm${client.data.uid} (${client.id})`,
    );
  }

  async handleDisconnect(client: Socket) {
    if (client.data.uid === undefined) return;
    this.sockets.delete(client.data.uid);
  }

  private async validateUser(client: Socket) {
    const token = this.getToken(client);
    const user = await this.authService.validateToken(token);
    if (user == null || user == undefined)
      throw new WsException('잘못된 사용자입니다.');
    console.log(this.sockets);
    const isExist = this.sockets.has(user.uid);

    client.emit('login/isExist', isExist);
    if (!user || isExist) {
      client.disconnect();
      return;
    }
    this.sockets.add(user.uid);
    client.data = { uid: user.uid };
  }

  private getToken(client: Socket) {
    return client.handshake.headers.authorization;
  }

    
  @SubscribeMessage('message')
  handleMessage(client: Socket, payload: any) {
    console.log(payload);
  }
}
