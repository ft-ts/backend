import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { Ball } from '../game/entities/ball.entity';
import { Paddle } from '../game/entities/paddle.entity';
import { gameConstants} from './game.constant';
import { PongRepository } from '../pong.repository';
import { MatchType } from '../pong.enum';
import { UserStatus } from 'src/user/enums/userStatus.enum';
import { MatchInfo, GameInfo, MatchResult, ReadyStatus } from './game.interface';
import { setMatchInfo, setMatchResult } from './game.utils'
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class GameService{
  
  private _matchInfo : Map<string, MatchInfo>;
  private _readyStatus : Map<string, ReadyStatus>;
  private _socketCheck : Map<number, boolean>;
  
  constructor(
    private readonly pongRepository: PongRepository,
  ){
    Logger.debug(`[🏓GameService] constructor`);
    this._matchInfo = new Map<string, MatchInfo>();
    this._readyStatus = new Map<string, ReadyStatus>();
    this._socketCheck = new Map<number, boolean>();
  }
    
  async handleConnection(
    client: Socket,
  ){
    Logger.debug(`[🏓GameService] handleConnection ${client.data.uid}`);
    this._socketCheck.set(client.data.uid, true);
  }

  async handleDisconnect(
    client: Socket,
  ){
    Logger.debug(`[🏓GameService] handleDisconnect ${client.data.uid}`);
    this._socketCheck.set(client.data.uid, false);
  }

  async getUserInfo(
    uid : number,
  ){
    const user : User = await this.pongRepository.getUserEntity(uid);
    const partialUser : Partial<User> = {
      uid : user.uid,
      name : user.name,
      avatar : user.avatar,
      status : user.status,
    }
    return (partialUser);
  }
    
  async createGame(
    client1 : Socket,
    client2 : Socket,
    matchType : MatchType,
  ){
    const client1Elo : number = await this.pongRepository.getUserElo(client1.data.uid);
    const client2Elo : number = await this.pongRepository.getUserElo(client2.data.uid);
    const matchInfo : MatchInfo = await setMatchInfo(client1, client2, matchType, client1Elo, client2Elo);
    this._matchInfo.set(matchInfo.match_id, matchInfo);
    this._readyStatus.set(matchInfo.match_id, {
      home : false,
      away : false,
    });
    Logger.log(`[🏓GameService] createGame ${matchInfo.match_id} ${client1.data.uid} ${client2.data.uid}`);

    const type : boolean = matchInfo.match_type === MatchType.LADDER;
    await client1.emit('pong/game/init', { matchID : matchInfo.match_id, isHome : true, type : type});
    await client2.emit('pong/game/init', { matchID : matchInfo.match_id, isHome : false, type: type});
  }

  async initGame(
    client : Socket,
    payload : { matchID: string, mode: boolean }
  ){
    Logger.log(`[🏓GameService] initGame ${payload.matchID}`);
    const gameInfo : GameInfo = this._matchInfo.get(payload.matchID).gameInfo;
    if (payload.mode === false)
      gameInfo.ball.setSpeed(gameConstants.ballSpeed * 1.5);
    const matchInfo : MatchInfo = this._matchInfo.get(payload.matchID);
    matchInfo.home.emit('pong/game/set');
    matchInfo.away.emit('pong/game/set');
  }

  async readyGame(
    client : Socket,
    payload : { matchID: string }
  ){
    Logger.log(`[🏓GameService] readyGame ${payload.matchID}`);
    const matchInfo = this._matchInfo.get(payload.matchID);
    const readyStatus = this._readyStatus.get(payload.matchID);
    const gameInfo : GameInfo = this._matchInfo.get(payload.matchID).gameInfo;
    
    await this.pongRepository.updateUserStatus(client.data.uid, UserStatus.IN_GAME);
    if (client.data.uid === matchInfo.home.data.uid){
      client.emit('pong/game/start', {
        home : gameInfo.home_paddle.toDto(),
        away : gameInfo.away_paddle.toDto(),
        ball : gameInfo.ball.toDto()
      });
      readyStatus.home = true;
    } else if (client.id === matchInfo.away.id){
      client.emit('pong/game/start', {
        home : gameInfo.home_paddle.toDto(),
        away : gameInfo.away_paddle.toDto(),
        ball : gameInfo.ball.toDto()});
      readyStatus.away = true;
    }
    const timeOut = setTimeout(() => {
      if (readyStatus.home && !readyStatus.away){
        gameInfo.away_paddle.setScore(-1);
      } else if (!readyStatus.home && readyStatus.away){
        gameInfo.home_paddle.setScore(-1);
      }
      this.startGame(payload.matchID);
    }, 1000);
  }

  async startGame(
    matchID: string,
  ){
    console.log('startGame');
    const matchInfo: MatchInfo = this._matchInfo.get(matchID);
    Logger.log(`[🏓GameService] startGame ${matchInfo.match_id}`);
    this._gameLoop = this._gameLoop.bind(this);
    matchInfo.interval = setInterval(
      this._gameLoop,
      gameConstants.gameInterval,
      matchInfo,
    )
  }

  async keyEvent(
      client : Socket,
      payload : { key: string, matchID : string},
  ){
    const matchInfo : MatchInfo = this._matchInfo.get(payload.matchID);
    if (matchInfo === undefined || matchInfo === null) return (false);
    const player : Paddle = client.data.uid === matchInfo.home.data.uid ? matchInfo.gameInfo.home_paddle : matchInfo.gameInfo.away_paddle;
    player.update(payload.key);
  }

  private async _gameLoop(
    matchInfo: MatchInfo,
  ){
    console.log('gameLoop');
    
    const gameInfo : GameInfo = matchInfo.gameInfo;

    gameInfo.is_finish = await gameInfo.ball.update();
    if (gameInfo.is_finish){
      await this._endGame(matchInfo);
    } else if (this._socketCheck.get(matchInfo.home.data.uid) === false){
      gameInfo.home_paddle.setScore(-1);
      await this._endGame(matchInfo);
    } else if (this._socketCheck.get(matchInfo.away.data.uid) === false) {
      gameInfo.away_paddle.setScore(-1);
      await this._endGame(matchInfo);
    } else {
      matchInfo.home.emit('pong/game/update', {
        home: gameInfo.home_paddle.toDto(),
        away: gameInfo.away_paddle.toDto(),
        ball: gameInfo.ball.toDto(),
      });
      matchInfo.away.emit('pong/game/update', {
        home: gameInfo.home_paddle.toDto(),
        away: gameInfo.away_paddle.toDto(),
        ball: gameInfo.ball.toDto(),
      });
    }
  }

  private async _endGame(
    matchInfo : MatchInfo 
  ){
    clearInterval(matchInfo.interval);
    Logger.log(`[🏓GameService] endGame ${matchInfo.match_id}`);
    this._matchInfo.delete(matchInfo.match_id);
    this._readyStatus.delete(matchInfo.match_id);

    const home : User = await this.pongRepository.getUserEntity(matchInfo.home.data.uid);
    const away : User = await this.pongRepository.getUserEntity(matchInfo.away.data.uid);
    const matchResult : MatchResult = await setMatchResult(matchInfo, home, away);
    this.pongRepository.saveMatchInfo(matchResult);

    const homeScore : number = matchInfo.gameInfo.home_paddle.getScore();
    const awayScore : number = matchInfo.gameInfo.away_paddle.getScore();
    matchInfo.home.emit('pong/game/end', {
      is_win : homeScore > awayScore,
      home_score : homeScore,
      away_score : awayScore,
    })
    matchInfo.away.emit('pong/game/end', {
      is_win : awayScore > homeScore,
      home_score : homeScore,
      away_score : awayScore,
    })
    const winner : User = homeScore > awayScore ? home : away;
    const winner_elo : number = homeScore > awayScore ? matchInfo.home_elo : matchInfo.away_elo;
    const loser : User = homeScore > awayScore ? away : home;
    const loser_elo : number = homeScore > awayScore ? matchInfo.away_elo : matchInfo.home_elo;
    const matchType : MatchType = matchInfo.match_type;
    this.pongRepository.updateUserEntity(winner, winner_elo, loser_elo, true, matchType);
    this.pongRepository.updateUserEntity(loser, loser_elo, winner_elo, false, matchType);
    if (this._socketCheck.get(matchInfo.home.data.uid) === true){
      console.log('home', home.uid);
      await this.changeStatus(matchInfo.home, 0);
      // matchInfo.home.emit('update/userInfo', {uid: home.uid});
    }
    if (this._socketCheck.get(matchInfo.away.data.uid) === true){
      console.log('away', away.uid);
      await this.changeStatus(matchInfo.away, 0);
      // matchInfo.away.emit('update/userInfo', {uid: away.uid});
    }
  }

  async changeStatus(
    client : Socket,
    statusCode : number,
  ){
    let status: UserStatus;
    if (statusCode === 0){
      status = UserStatus.ONLINE;
    } else if (statusCode === 1){
      status = UserStatus.OFFLINE;
    } else if (statusCode === 2){
      status = UserStatus.IN_GAME;
    }
    await this.pongRepository.updateUserStatus(client.data.uid, status);
  }
}