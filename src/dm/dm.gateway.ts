import { 
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { DmService } from './dm.service';
import { UserService } from 'src/user/user.service';
import { Socket, Server } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { CheckBlocked } from 'src/common/guards/block.guard';

@WebSocketGateway({
  cors: {
    origin: true,
  },
})
export class DmGateway 
implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly dmService: DmService,
  ) { }

  @WebSocketServer()
  server: Server;

  async handleConnection(client: Socket) {
    await this.dmService.addSocket(client);
  }

  async handleDisconnect(client: Socket) {
    await this.dmService.removeSocket(client);
  }

  @UseGuards(CheckBlocked)
  @SubscribeMessage('dm/msg')
  async sendDM(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: {targetUid: number, message: string}
  ) {
    const senderUid : number = client.data.uid;
    const receiver : Socket = this.dmService.getSocketByUid(payload.targetUid);
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
