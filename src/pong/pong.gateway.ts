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
import { SocketService } from 'src/common/service/socket.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: true,
  },
})
export class PongGateway 
implements OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly pongService: PongService,
    private readonly gameService: GameService,
    private readonly socketService: SocketService,
  ) {
    Logger.debug('PongGateway constructor');
  }

  handleDisconnect(client: any) {
    Logger.debug(`[🏓PongGateway] ${client.data.uid} disconnected`);
    this.pongService.handleDisconnect(client);
  }


  @SubscribeMessage('pong/ladder/join')
  async joinLadder(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ){
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
   /*
    **
    */
    this.pongService.cancleLadder(client);
    client.emit('pong/ladder/cancle');
  }

  /*
  ** @payload : { uid: string }
  */
  @SubscribeMessage('pong/match/invite')
  async inviteMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ){
  }

  
  /*
  ** @payload : { uid: string }
  */
  @SubscribeMessage('pong/match/accept')
  async acceptMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ){
   const opponent: Socket | null = await this.socketService.getSocket(payload.uid);
   if (opponent === null){
    Logger.debug(`[PongGateway acceptMatch] ${payload.uid} is not connected`);
   }
  }
      
  @SubscribeMessage('pong/match/reject')
  async rejectMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ){
    const opponent: Socket | null = await this.socketService.getSocket(payload.uid);
    if (opponent === null){
      Logger.debug(`[PongGateway rejectMatch] ${payload.uid} is not connected`);
      return
    }
    opponent.emit('pong/match/reject', client.data.uid);
  }

  @SubscribeMessage('pong/game/keyEvent')
  async keyEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { key: string, matchID : string },
  ){
    this.gameService.keyEvent(client, payload);
  }


  @SubscribeMessage('pong/game/ready')
  async ready(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { matchID: string},
  ){
    this.gameService.readyGame(client, payload);
  }

}