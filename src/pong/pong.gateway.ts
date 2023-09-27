import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { PongService } from './pong.service';
import { GameService } from './game/game.service';
import { MatchType } from './pong.enum';
import { SocketService } from 'src/common/service/socket.service';
import { Logger } from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';
import { UserStatus } from 'src/user/enums/userStatus.enum';

@WebSocketGateway({
  cors: {
    origin: true,
  },
})
export class PongGateway 
implements OnGatewayConnection ,OnGatewayDisconnect
{
  constructor(
    private readonly pongService: PongService,
    private readonly gameService: GameService,
    private readonly socketService: SocketService,
  ) {
    Logger.debug('PongGateway constructor');
  }

  @WebSocketServer()
  server: Server;

  handleConnection(client: any) {
    Logger.debug(`[🏓PongGateway] ${client.data.uid} connected`);
    this.pongService.handleConnection(client);
  }

  handleDisconnect(client: any) {
    Logger.debug(`[🏓PongGateway] ${client.data.uid} disconnected`);
    this.pongService.handleDisconnect(client);
  }


  @SubscribeMessage('pong/ladder/join')
  async joinLadder(
    @ConnectedSocket() client: Socket,
  ){
    await this.gameService.changeStatus(client, 2);
    this.server.emit('update/userInfo', {uid: client.data.uid}) 
    this.pongService.joinLadder(client);
  }

  @SubscribeMessage('pong/ladder/cancle')
  async cancleLadder(
    @ConnectedSocket() client: Socket,
  ){
    await this.gameService.changeStatus(client, 0);
    this.server.emit('update/userInfo', {uid: client.data.uid})
    this.pongService.cancleLadder(client);
  }

  @SubscribeMessage('pong/match/invite')
  async inviteMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: {uid: number},
  ){
    const opponent: Socket | null = await this.socketService.getSocket(payload.uid);
    if (opponent === null){
      Logger.debug(`[PongGateway inviteMatch] ${payload.uid} is not connected`);
      return ;
    }
    const home : Partial<User> = await this.pongService.getUserInfo(client.data.uid);
    const away : Partial<User> = await this.pongService.getUserInfo(payload.uid);
    if (away.status !== UserStatus.ONLINE){
      return ;
    }
    await this.gameService.changeStatus(client, 2);
    this.server.emit('update/userInfo', {uid: client.data.uid});
    await this.gameService.changeStatus(opponent, 2);
    this.server.emit('update/userInfo', {uid: opponent.data.uid});
    opponent.emit('pong/match/invite', {user: home});
    client.emit('pong/match/invite/wating', {user: away});
  }

  @SubscribeMessage('pong/match/invite/cancle')
  async cancleMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: {uid: number},
  ){
    const opponent: Socket | null = await this.socketService.getSocket(payload.uid);
    if (opponent === null){
      return ;
    }
    await this.gameService.changeStatus(client, 0);
    this.server.emit('update/userInfo', {uid: client.data.uid});
    await this.gameService.changeStatus(opponent, 0);
    this.server.emit('update/userInfo', {uid: opponent.data.uid});
    // const home : Partial<User> = await this.pongService.getUserInfo(client.data.uid);
    // const away : Partial<User> = await this.pongService.getUserInfo(payload.uid);
    opponent.emit('pong/match/invite/cancle');
    client.emit('pong/match/invite/cancle');
  }

  /*
  ** @payload : { uid: number }
  */
  @SubscribeMessage('pong/match/invite/accept')
  async acceptMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ){
   const opponent: Socket | null = await this.socketService.getSocket(payload.uid);
   if (opponent === null){
    Logger.debug(`[PongGateway acceptMatch] ${payload.uid} is not connected`);
    return ;
   }
   await this.gameService.createGame(client, opponent, MatchType.CUSTOM);
  }

  @SubscribeMessage('pong/match/invite/reject')
  async rejectMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ){
    const opponent: Socket | null = await this.socketService.getSocket(payload.uid);
    if (opponent === null){
      Logger.debug(`[PongGateway rejectMatch] ${payload.uid} is not connected`);
      return ;
    }
    opponent.emit('pong/match/invite/reject', client.data.uid);
    client.emit('pong/init');
    await this.gameService.changeStatus(client, 0);
    this.server.emit('update/userInfo', {uid: client.data.uid});
    await this.gameService.changeStatus(opponent, 0);
    this.server.emit('update/userInfo', {uid: opponent.data.uid});
  }
  
  @SubscribeMessage('pong/game/init')
  async initGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ){
    this.gameService.initGame(client, payload);
  }

  @SubscribeMessage('pong/game/keyEvent')
  async keyEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { key: string, matchID : string },
  ){
    this.gameService.keyEvent(client, payload);
  }


  @SubscribeMessage('pong/game/start')
  async ready(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { matchID: string},
  ){
    this.gameService.readyGame(client, payload);
  }

  @SubscribeMessage('pong/init')
  async init(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ){
    client.emit('pong/init');
  }

}