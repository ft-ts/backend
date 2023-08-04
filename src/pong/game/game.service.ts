import { Injectable } from "@nestjs/common";
import { Socket } from "socket.io";
import { MatchInfoDto, GameInfo, UpdateMatchInfoDto } from "../dto/pong.dto";
import { Ball } from "../game/entities/ball.entity";
import { Paddle } from "../game/entities/paddle.entity";
import { gameConstants} from "./game.constant";
import { PongRepository } from "../pong.repository";

@Injectable()
export class GameService{
  constructor(
    private readonly pongRepository: PongRepository,
  ){
    console.log('GameService constructor');
  }

  async gameStart(
    client1: Socket,
    client2: Socket,
    matchInfo: MatchInfoDto,
  ){
    console.log('game Init');
    const gameInfo: GameInfo = await this.setGameInfo(client1, client2);
    client1.data = { ...client1.data, gameInfo: gameInfo };
    await client1.emit('pong/game/ready', {
      player1: gameInfo.player1.toDto(),
      player2: gameInfo.player2.toDto(),
      ball: gameInfo.ball.toDto(),
    });
    client2.data = { ...client2.data, gameInfo: gameInfo };
    await client2.emit('pong/game/ready', {
      player1: gameInfo.player2.toDto(),
      player2: gameInfo.player1.toDto(),
      ball: gameInfo.ball.toDto(),
    });
    this.gameLoop = this.gameLoop.bind(this);
    matchInfo.interval = setInterval(() => {
      this.gameLoop(gameInfo, matchInfo);
    }
    , gameConstants.gameInterval);
  }

  private async setGameInfo(
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

  private async gameLoop(
    gameInfo: GameInfo,
    matchInfo: MatchInfoDto,
  ){
    console.log('gameLoop');
    gameInfo.ball.update();
    console.log(gameInfo.player1.getScore(), gameInfo.player2.getScore());
    console.log(gameInfo.ball.toDto());
    if (gameInfo.player1.getScore() >= gameConstants.maxScore || 
    gameInfo.player2.getScore() >= gameConstants.maxScore){
      console.log('endGame')
      console.log(gameInfo.player1.getScore(), gameInfo.player2.getScore());
      await this.endGame(matchInfo, gameInfo);
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

  async keyEvent(
    client: Socket,
    payload: any,
  ){
    console.log('keyEvent');
    client.data.paddle.update(payload.keyInput);
  }
  
  private async endGame(
    matchInfo: MatchInfoDto,
    gameInfo: GameInfo,
  ){
    console.log('endGame');
    matchInfo.user1_score = gameInfo.player1.getScore();
    matchInfo.user2_score = gameInfo.player2.getScore();
    matchInfo.winner_id = gameInfo.player1.getScore() > gameInfo.player2.getScore() ? matchInfo.user1.data.uid : matchInfo.user2.data.uid;
    matchInfo.loser_id = gameInfo.player1.getScore() > gameInfo.player2.getScore() ? matchInfo.user2.data.uid : matchInfo.user1.data.uid;

    await matchInfo.user1.leave(matchInfo.matchID);
    await matchInfo.user1.emit('pong/game/end', {
      winner: matchInfo.user1.data.uid === matchInfo.winner_id,
      client1_score: matchInfo.user1_score,
      client2_score: matchInfo.user2_score,
    });
    await matchInfo.user2.emit('pong/game/end', {
      winner: matchInfo.user2.data.uid === matchInfo.winner_id,
      client1_score: matchInfo.user2_score,
      client2_score: matchInfo.user1_score,
    });
    clearInterval(matchInfo.interval);

     const player1_new_point: number = await this.calculateEloPoint(
      matchInfo.user1_elo,
      matchInfo.user2_elo,
      matchInfo.winner_id === matchInfo.user1.data.uid,
    );
    const player2_new_point: number = await this.calculateEloPoint(
      matchInfo.user2_elo,
      matchInfo.user2_elo,
      matchInfo.winner_id === matchInfo.user2.data.uid,
    );
    const updatedDto : UpdateMatchInfoDto = await this.createUpdaeMatchInfo(matchInfo);
    await this.saveGameResult(updatedDto, player1_new_point, player2_new_point);
  }

  private async createUpdaeMatchInfo(
    matchInfo: MatchInfoDto,
  ): Promise<UpdateMatchInfoDto>{
    console.log('saveGameResult');

    const updateDto: UpdateMatchInfoDto = {
      match_id: matchInfo.matchID,
      user1_id: matchInfo.user1.data.uid,
      user2_id: matchInfo.user2.data.uid,
      match_type: matchInfo.matchType,
      user1_score: matchInfo.user1_score,
      user2_score: matchInfo.user2_score,
      winner_id: matchInfo.winner_id,
      loser_id: matchInfo.loser_id,
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
    user1_new_elo: number,
    user2_new_elo: number,
  ){
    console.log('saveGameResult');
    await this.pongRepository.saveMatchInfo(matchInfo);
    await this.pongRepository.updateUsersElo(matchInfo.user1_id, user1_new_elo);
    await this.pongRepository.updateUsersElo(matchInfo.user2_id, user2_new_elo);
  }
}