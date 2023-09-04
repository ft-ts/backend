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
export class PongGateway {

  constructor(
    private readonly pongService: PongService,
    private readonly gameService: GameService,
    private readonly authService: AuthService,
    private readonly socketService: SocketService,
  ) {
    Logger.debug('PongGateway constructor');
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
    const test = await this.socketService.getSocket(client.data.uid);
    if (test === null){
      Logger.debug(`[PongGateway joinLadder] ${client.data.uid} is not connected`);
    } else {
      Logger.debug(`[PongGateway joinLadder] ${client.data.uid} is connected`);
    }
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

  /*
  ** @payload : { uid: string }
  */
  @SubscribeMessage('pong/match/invite')
  async inviteMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ){
    console.log('pong/invite', payload);

  }

  
  /*
  ** @payload : { uid: string }
  */
  @SubscribeMessage('pong/match/accept')
  async acceptMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ){
    console.log('pong/accept', payload);
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
    console.log('pong/reject', payload);
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