import { 
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { DmService } from './dm.service';
import { SocketService } from 'src/common/service/socket.service';
import { Socket, Server } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { CheckBlocked } from 'src/common/guards/block.guard';

@WebSocketGateway({
  cors: {
    origin: true,
  },
})
export class DmGateway {
  constructor(
    private readonly dmService: DmService,
    private readonly socketService: SocketService,
  ) { }

  @WebSocketServer()
  server: Server;

  @UseGuards(CheckBlocked)
  @SubscribeMessage('dm/msg')
  async sendDM(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: {targetUid: number, message: string}
  ) {
    const senderUid : number = client.data.uid;
    const receiver: Socket | null = await this.socketService.getSocket(payload.targetUid);
    if (receiver) {
      await receiver.join(`dm-${payload.targetUid}`);
    }
    const dm = await this.dmService.saveDmLog(senderUid, payload);
    await client.join(`dm-${payload.targetUid}`);
    this.server
      .to(`dm-${payload.targetUid}`)
      .emit('dm/msg', dm);
    await client.leave(`dm-${payload.targetUid}`);
    if (receiver) {
      await receiver.leave(`dm-${payload.targetUid}`);
    }
  }
}
