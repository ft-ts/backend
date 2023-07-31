import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer } from '@nestjs/websockets';
import { DmService } from './dm.service';
import { Socket, Server } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';

@WebSocketGateway({
  namespace: 'dm',
  cors: {
    origin: process.env.FRONTEND,
  },
})
export class DmGateway {
  constructor(
    private readonly dmService: DmService,
    private readonly authService: AuthService,
  ) {}

  @WebSocketServer()
  server: Server;

  async handleConnection(client: Socket) {
    if (!this.authService.validateSocket(client))
    {
      client.disconnect();
      return;
    }
    console.log('dm/handleConnection', client.id, client.data);
    await client.join(`dm_${client.data.uid}`);
  }

  @SubscribeMessage('dm/msg')
  async sendDM(client: Socket, payload: any) {
    payload.senderUid = client.data.uid;
    await this.dmService.saveDmLog(payload);

    await client.join(`dm_${payload.receiverUid}`);
    this.server
    .to(`dm_${payload.receiverUid}`)
    .emit('dm/msg', payload);
    await client.leave(`dm_${payload.receiverUid}`);
  }

}
