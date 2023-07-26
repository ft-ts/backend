import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { DmService } from './dm.service';
import { Socket } from 'socket.io';

@WebSocketGateway()
export class DmGateway {
  constructor(private readonly dmService: DmService) {}


  @SubscribeMessage('createDmChannel')
  async createDmChannel(@ConnectedSocket() client: Socket, payload: any) {
    const userA = client.data.user;
    const userB = payload.userB;
    const channel = await this.dmService.createDmChannel(userA, userB);
    return channel;
  }
}
