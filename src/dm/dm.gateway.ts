import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { DmService } from './dm.service';
import { Socket } from 'socket.io';

@WebSocketGateway()
export class DmGateway {
  constructor(private readonly dmService: DmService) {}

}
