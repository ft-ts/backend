import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer } from '@nestjs/websockets';
import { DmService } from './dm.service';
import { Socket, Server } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { DmType } from './enum/dm.type';
import { DmResultType } from './enum/dm.result';

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
  ) { }

  @WebSocketServer()
  server: Server;

  async handleConnection(client: Socket) {
    if (!this.authService.validateSocket(client)) {
      client.disconnect();
      return;
    }
    await client.join(`dm-${client.data.uid}`);
    this.checkRequests(client);
  }

  @SubscribeMessage('dm/msg')
  async sendDM(client: Socket, payload: any) {
    payload.senderUid = client.data.uid;

    await this.dmService.saveDmLog(payload);
    await client.join(`dm-${payload.receiverUid}`);
    this.server
      .to(`dm-${payload.receiverUid}`)
      .emit('dm/msg', payload);
    await client.leave(`dm-${payload.receiverUid}`);
  }

  @SubscribeMessage('dm/request')
  async sendRequest(client: Socket, payload: any) {
    payload.senderUid = client.data.uid;

    if (payload.request_type === DmType.MATCH) {
      const matchRequest = await this.dmService.handleMatchRequest(payload);
      if (matchRequest.result !== DmResultType.FAIL) {
        this.server
          .to(`dm-${payload.receiverUid}`)
          .emit("dm/request", matchRequest);
      }
      client.emit("dm/request", matchRequest);
    }
  }

  @SubscribeMessage('dm/response')
  async sendResponse(client: Socket, payload: any) {
    payload.senderUid = client.data.uid;

    const dmResponse = await this.dmService.handleResponse(payload);
    if (dmResponse.result === DmResultType.FAIL || dmResponse.result === DmResultType.SUCCESS)
      this.server
        .to(`dm-${payload.receiverUid}`)
        .emit('dm/response', dmResponse);
    client.emit('dm/response', dmResponse);
  }

  @SubscribeMessage('dm/request/cancel')
  async cancelRequest(client: Socket, payload: any) {
    payload.senderUid = client.data.uid;
    const result = await this.dmService.cancelFriendRequest(payload);
    if (result.result === 'CANCELED')
      this.server
        .to(`dm-${payload.receiverUid}`)
        .emit('dm/request/cancel', result);
    client.emit('dm/request/cancel', result);
  }

  async checkRequests(client: Socket) {
    const requests = await this.dmService.getPendingRequests(client.data.uid);
    if (!requests || requests.length === 0)
      return;

    console.log('dm/checkRequests', requests);
    client.emit('dm/request', requests);
  }
}
