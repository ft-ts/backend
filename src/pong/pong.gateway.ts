import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { PongService } from './pong.service';

@WebSocketGateway({
  namespace: 'pong',
  cors: {
    origin: process.env.FRONTEND,
  },
})
export class PongGateway
implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {

  @WebSocketServer()
  private server: Server;
  constructor(
    private readonly pongService: PongService,
  ) {
    console.log('constructor');
  }

  afterInit(server: Server) {
    console.log('afterInit');
    this.server = server;
  }

  handleConnection(client: Socket) {
    console.log('handleConnection');
  }

  handleDisconnect(client: Socket) {
    console.log('handleDisconnect');
  }

  @SubscribeMessage('pong/ladder/join')
  async joinLadder(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ){
    console.log('pong/match', payload);
  }

  @SubscribeMessage('pong/ladder/cancle')
  async cancleLadder(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ){
    console.log('pong/cancle', payload);
  }

  @SubscribeMessage('pong/match/invite')
  async inviteMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ){
    console.log('pong/event', payload);
  }


  @SubscribeMessage('pong/match/accept')
  async acceptMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ){
    console.log('pong/accept', payload);
  }

  @SubscribeMessage('pong/match/reject')
  async rejectMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ){
    console.log('pong/reject', payload);
  }

  @SubscribeMessage('pong/game/ready')
  async readyGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ){
    console.log('pong/ready', payload);
  }
  
  @SubscribeMessage('pong/game/start')
  async startGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ){
    console.log('pong/start', payload);
  }

  @SubscribeMessage('pong/game/finish')
  async finishGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ){
    console.log('pong/exit', payload);
  }

  @SubscribeMessage('pong/game/keyEvent')
  async keyEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ){
    console.log('pong/keyEvent', payload);
  }

}