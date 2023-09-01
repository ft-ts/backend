import { Injectable } from "@nestjs/common";
import { Socket } from "socket.io";
import { MatchInfo, GameInfo, UpdateMatchInfoDto } from "../pong.dto";
import { Ball } from "../game/entities/ball.entity";
import { Paddle } from "../game/entities/paddle.entity";
import { gameConstants} from "./game.constant";
import { PongRepository } from "../pong.repository";
import { MatchType } from "../pong.enum"

@Injectable()
export class GameService{

  private _matchInfo : Map<string, MatchInfo>;

  constructor(
    private readonly pongRepository: PongRepository,
  ){
    console.log('GameService constructor');
    this._matchInfo = new Map<string, MatchInfo>();
  }
  async createGame(
    client1 : Socket,
    client2 : Socket,
    matchType : MatchType,
  ){
    console.log('createGame');
    const matchInfo : MatchInfo = await this._setMatchInfo(client1, client2, matchType);
    this._matchInfo.set(matchInfo.matchID, matchInfo);
    await client1.emit('pong/game/init', { matchID : matchInfo.matchID});
    await client2.emit('pong/game/init', { matchID : matchInfo.matchID});
  }

  async readyGame(
    payload : { matchID: string }
  ){
    console.log('readyGame');
    const client1 : Socket = this._matchInfo.get(payload.matchID).user1;
    const client2 : Socket = this._matchInfo.get(payload.matchID).user2;
    const gameInfo : GameInfo = this._matchInfo.get(payload.matchID).gameInfo;

    await client1.emit('pong/game/ready', {
      player1: gameInfo.player1.toDto(),
      player2: gameInfo.player2.toDto(),
      ball: gameInfo.ball.toDto(),
    });
    await client2.emit('pong/game/ready', {
      player1: gameInfo.player2.toDto(),
      player2: gameInfo.player1.toDto(),
      ball: gameInfo.ball.toDto(),
    });
  }

  async startGame(
    matchID: string,
  ){
    const matchInfo: MatchInfo = this._matchInfo.get(matchID);
    this._gameLoop = this._gameLoop.bind(this);
    matchInfo.interval = setInterval(() => {
      this._gameLoop(matchInfo);
    }
    , gameConstants.gameInterval);
  }

  async keyEvent(
      client : Socket,
      payload : { key: string, matchID : string},
  ){
      console.log('keyEvent');
      const gameInfo : GameInfo = this._matchInfo.get(payload.matchID).gameInfo;
      const player : Paddle = client.id === gameInfo.player1.getPlayerID() ? gameInfo.player1 : gameInfo.player2;
      player.update(payload.key);
  }
    
  private async _setMatchInfo(
    client1: Socket,
    client2: Socket,
    matchType: MatchType,
  ) : Promise<MatchInfo>{
    const gameInfo : GameInfo = await this._setGameInfo(client1, client2);
    const matchID : string = Math.random().toString(36).slice(2);
    console.log('matchID', matchID);
    const matchInfo : MatchInfo = {
      matchType: matchType,
      matchID: matchID,
      user1: client1,
      user2: client2,
      user1_score: 0,
      user2_score: 0,
      user1_elo: 0,
      user2_elo: 0,
      winner_id: 0,
      loser_id: 0,
      start_date: new Date(),
      interval: null,
      gameInfo: gameInfo,
    }
    return (matchInfo);
  }
  
  
  private async _setGameInfo(
    client1: Socket,
    client2: Socket,
    ) : Promise<GameInfo>{
      const player1: Paddle = new Paddle(true, client1.id);
      const player2: Paddle = new Paddle(false, client2.id);
      const ball: Ball = new Ball(player1, player2);
      const gameInfo: GameInfo = {
        player1: player1,
        player2: player2,
        ball: ball,
      }
      return (gameInfo);
  }

  private async _gameLoop(
    matchInfo: MatchInfo,
  ){
    const gameInfo : GameInfo = matchInfo.gameInfo;

    gameInfo.ball.update();
    if (gameInfo.player1.getScore() >= gameConstants.maxScore || 
    gameInfo.player2.getScore() >= gameConstants.maxScore){
      // console.log('endGame', gameInfo.player1.getScore(), gameInfo.player2.getScore());
      clearInterval(matchInfo.interval);
      await this.endGame(matchInfo);
    } else {
      matchInfo.user1.emit('pong/game/update', {
        player1: gameInfo.player1.toDto(),
        player2: gameInfo.player2.toDto(),
        ball: gameInfo.ball.toDto(),
      });
      matchInfo.user2.emit('pong/game/update', {
        player1: gameInfo.player2.toDto(),
        player2: gameInfo.player1.toDto(),
        ball: gameInfo.ball.toDto(),
      });
    }
  }
  private async endGame(
    matchInfo: MatchInfo,
  ){
    console.log('endGame');
    const gameInfo = matchInfo.gameInfo;
    matchInfo.user1_score = gameInfo.player1.getScore();
    matchInfo.user2_score = gameInfo.player2.getScore();
    matchInfo.winner_id = gameInfo.player1.getScore() > gameInfo.player2.getScore() ? matchInfo.user1.data.uid : matchInfo.user2.data.uid;
    matchInfo.loser_id = gameInfo.player1.getScore() > gameInfo.player2.getScore() ? matchInfo.user2.data.uid : matchInfo.user1.data.uid;

    matchInfo.user1.emit('pong/game/end', {
      winner: matchInfo.user1.data.uid === matchInfo.winner_id,
      client1_score: matchInfo.user1_score,
      client2_score: matchInfo.user2_score,
    });
    matchInfo.user2.emit('pong/game/end', {
      winner: matchInfo.user2.data.uid === matchInfo.winner_id,
      client1_score: matchInfo.user2_score,
      client2_score: matchInfo.user1_score,
    });

    const winner_elo: number = matchInfo.winner_id === matchInfo.user1.data.uid ? matchInfo.user1_elo : matchInfo.user2_elo;
    const loser_elo: number = matchInfo.winner_id === matchInfo.user1.data.uid ? matchInfo.user2_elo : matchInfo.user1_elo;
    const winner_new_elo: number = await this.calculateEloPoint(
      winner_elo,
      loser_elo,
      true,
    );
    const loser_new_elo: number = await this.calculateEloPoint(
      loser_elo,
      winner_elo,
      false,
    );
    const updatedDto : UpdateMatchInfoDto = await this.createUpdaeMatchInfo(matchInfo);
    this._matchInfo.delete(matchInfo.matchID);
    await this.saveGameResult(updatedDto, winner_new_elo, loser_new_elo);
  }

  private async createUpdaeMatchInfo(
    matchInfo: MatchInfo,
  ): Promise<UpdateMatchInfoDto>{
    console.log('createupdateMatchInfo');

    const winner_id = await this.pongRepository.getUserNameByUID(matchInfo.winner_id);
    const loser_id = await this.pongRepository.getUserNameByUID(matchInfo.loser_id);
    console.log(winner_id, loser_id)
    const updateDto: UpdateMatchInfoDto = {
      winner_id: winner_id,
      winner_score: matchInfo.user1_score > matchInfo.user2_score ? matchInfo.user1_score : matchInfo.user2_score,
      loser_id: loser_id,
      loser_score: matchInfo.user1_score > matchInfo.user2_score ? matchInfo.user2_score : matchInfo.user1_score,
      match_type: matchInfo.matchType,
      timestamp: matchInfo.start_date,
    }
    return (updateDto);
  }
  
  private async calculateEloPoint(
    myPoint: number,
    otherPoint: number,
    isWin: boolean,
  ): Promise<number>{
    console.log('calculateEloPoint');
    const K: number = 10;
    const W: number = isWin ? 1 : -1;
    const We: number = 1 / (1 + Math.pow(10, (otherPoint - myPoint) / 400));
    const newPoint: number = myPoint + K * (W - We);
    return (newPoint);
  }

  private async saveGameResult(
    matchInfo: UpdateMatchInfoDto,
    winner_elo: number,
    loser_elo: number,
  ){
    console.log('saveGameResult');
    await this.pongRepository.saveMatchInfo(matchInfo);
    await this.pongRepository.updateUsersElo(matchInfo.winner_id, winner_elo);
    await this.pongRepository.updateUsersElo(matchInfo.loser_id, loser_elo);
  }
}