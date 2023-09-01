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
import { MatchType } from './pong.enum';
import { AuthService } from 'src/auth/auth.service';

@WebSocketGateway({
  namespace: 'pong',
  cors: {
    origin: true,
  },
})
export class PongGateway
implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {

  @WebSocketServer()
  private server: Server;
  private rooms: any;
  private uidSocketMap: Map<string, Socket>;
  constructor(
    private readonly pongService: PongService,
    private readonly gameService: GameService,
    private readonly authService: AuthService,
  ) {
    console.log('constructor');

  }

  afterInit(server: any) {
    console.log('afterInit');
    this.server = server;
    this.rooms = server.adapter.rooms;
    this.uidSocketMap = new Map<string, Socket>();
  }

  handleConnection(client: Socket) {
    if (!this.authService.validateSocket(client))
    {
      console.log('pong handleConnection', 'invalid socket');
      client.disconnect();
      return ;
    }
    if (client.data.uid === undefined)
    {
      console.log('pong handleConnection', 'undefined uid');
      client.disconnect();
      return ;
    }
    // if (this.uidSocketMap.has(client.data.uid))
    // {
    //   console.log('pong handleConnection', 'already connected');
    //   client.disconnect();
    //   return ;
    // }
    console.log('pong handleConnection', client.data.uid);
    client.join(`pong_${client.data.uid}`);
    this.uidSocketMap.set(client.data.uid, client);
  }

  handleDisconnect(client: Socket) {
    console.log('pong handleDisconnect', client.data.uid);
    client.leave(`pong_${client.data.uid}`);
    this.uidSocketMap.delete(client.data.uid);
  }

  @SubscribeMessage('pong/ladder/join')
  async joinLadder(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ){
    console.log('pong/ladder/join', payload);
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
    console.log('pong/ladder/cancle', payload);
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
  // const opponent: Socket = this.server.sockets.sockets.get(payload.uid);
   if (this.rooms.has(`pong_${payload.uid}`) &&
       this.rooms.get(`pong_${payload.uid}`).size === 1){
      client.join(`pong_${payload.uid}`);
      this.pongService.matchFriend(client, opponent);
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
    this.uidSocketMap.get(payload.uid).emit('pong/match/reject', client.data.uid);
  }

  @SubscribeMessage('pong/game/keyEvent')
  async keyEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { key: string, matchID : string },
  ){
    console.log('pong/keyEvent', payload);
    this.gameService.keyEvent(client, payload);
  }


  @SubscribeMessage('pong/game/ready')
  async ready(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { matchID: string},
  ){
    console.log('pong/ready', payload);
    this.gameService.readyGame(payload);
  }
}