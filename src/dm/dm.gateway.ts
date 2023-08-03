import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer } from '@nestjs/websockets';
import { DmService } from './dm.service';
import { Socket, Server } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { DmType } from './enum/DM.enum';

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
    console.log('dm/handleConnection', client.id, client.data);
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
  async sendFriendRequest(client: Socket, payload: any) {

    payload.senderUid = client.data.uid;

    if (payload.request_type === DmType.FRIEND) {
      const friendRequest = await this.dmService.handleFriendRequest(payload);
      if (friendRequest.result !== 'FAILED') {
        this.server
          .to(`dm-${payload.receiverUid}`)
          .emit("dm/request", friendRequest);
      }
      client.emit("dm/request", friendRequest);
    }
    // if (request_type === notiType.MATCH)
    // await this.dmService.handleMatchRequest(payload);
  }

  @SubscribeMessage('dm/response')
  async sendResponse(client: Socket, payload: any) {
    payload.senderUid = client.data.uid;

    const result = await this.dmService.handleResponse(payload);
    if (result.result === 'ACCEPTED' || result.result === 'REJECTED')
      this.server
        .to(`dm-${payload.receiverUid}`)
        .emit('dm/response', result);
    client.emit('dm/response', result);
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
