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
import { GameService } from './game/game.service';
import { MatchType } from './enum/matchType.enum';

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
  private rooms: any;
  constructor(
    private readonly pongService: PongService,
    private readonly gameService: GameService,
    private uidSocketMap: Map<string, Socket> = new Map<string, Socket>(),
  ) {
    console.log('constructor');
  }

  afterInit(server: Server) {
    console.log('afterInit');
    this.server = server;
    this.rooms = server.sockets.adapter.rooms;
  }

  handleConnection(client: Socket) {
    console.log('handleConnection', client.data.uid);
    client.join(`pong_${client.data.uid}`);
    this.uidSocketMap.set(client.data.uid, client);
  }

  handleDisconnect(client: Socket) {
    console.log('handleDisconnect', client.data.uid);
    client.leave(`pong_${client.data.uid}`);
    this.uidSocketMap.delete(client.data.uid);
  }

  @SubscribeMessage('pong/ladder/join')
  async joinLadder(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ){
    console.log('pong/match', payload);
   /*
    **
    */
    this.pongService.joinLadder(client);
    client.emit('pong/ladder/join');
  }

  @SubscribeMessage('pong/ladder/cancle')
  async cancleLadder(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ){
    console.log('pong/cancle', payload);
   /*
    **
    */
    this.pongService.cancleLadder(client);
    client.emit('pong/ladder/cancle');
  }

  @SubscribeMessage('pong/match/invite')
  async inviteMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ){
    console.log('pong/invite', payload);

    /*
    ** @payload : { uid: string }
    */
  }


  @SubscribeMessage('pong/match/accept')
  async acceptMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ){
    console.log('pong/accept', payload);
    /*
    ** @payload : { uid: string }
    */
   const opponent: Socket = this.uidSocketMap.get(payload.uid);
   if (this.rooms.has(`pong_${payload.uid}`) &&
       this.rooms.get(`pong_${payload.uid}`).size === 1){
      client.join(`pong_${payload.uid}`);
      this.pongService.createGame(client, opponent, MatchType.CUSTOM);
    }
    else {
      console.log('pong/accept', 'error');
      //todo : error
    }
  }
      
  @SubscribeMessage('pong/match/reject')
  async rejectMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ){
    console.log('pong/reject', payload);
   /*
    ** @payload : { uid: string }
    */
   this.uidSocketMap.get(payload.uid).emit('pong/match/reject', client.data.uid);
  }

  @SubscribeMessage('pong/game/keyEvent')
  async keyEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ){
    console.log('pong/keyEvent', payload);
    this.gameService.keyEvent(client, payload);
  }

}