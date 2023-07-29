import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer } from '@nestjs/websockets';
import { DmService } from './dm.service';
import { Socket, Server } from 'socket.io';

@WebSocketGateway({
  namespace: 'dm',
  cors: {
    origin: process.env.FRONTEND,
  },
})
export class DmGateway {
  constructor(private readonly dmService: DmService) { }

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('dm/send')
  async sendDM(client: Socket, payload: any) {
    console.log('dm/send', payload);
    
    await client.join(`dm_${payload.senderUid}`);
    this.server
      .to(`dm_${payload.senderUid}`)
      .emit('dm/send', payload.senderUid, payload.msg);
    await client.leave(`dm${payload.senderUid}`);
  }
}
