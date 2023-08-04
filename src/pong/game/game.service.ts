import { Injectable } from "@nestjs/common";
import { Socket } from "socket.io";
import { MatchInfoDto, GameInfo, updateDto } from "../dto/pong.dto";
import { Ball } from "../game/entities/ball.entity";
import { Paddle } from "../game/entities/paddle.entity";
import { gameConstants} from "./game.constant";

@Injectable()
export class GameService{
  constructor(){
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
    // gameInfo.player1.update(matchInfo.user1.data.keyInput);
    // gameInfo.player2.update(matchInfo.user2.data.keyInput);
    if (matchInfo.user1.data.paddle.score >= gameConstants.maxScore || 
      matchInfo.user2.data.paddle.score >= gameConstants.maxScore){
        await this.endGame(matchInfo.user1, matchInfo.user2, matchInfo);
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
    client1: Socket,
    client2: Socket,
    matchInfo: MatchInfoDto,
  ){
    console.log('endGame');
    matchInfo.user1_score = client1.data.paddle.score;
    matchInfo.user2_score = client2.data.paddle.score;
    matchInfo.winner_id = client1.data.paddle.score > client2.data.paddle.score ? client1.data.uid : client2.data.uid;

    await client2.leave(matchInfo.matchID);
    await client1.emit('pong/game/end', {
      winner: client1.data.uid === matchInfo.winner_id,
      client1_score: matchInfo.user1_score,
      client2_score: matchInfo.user2_score,
    });
    await client2.emit('pong/game/end', {
      winner: client2.data.uid === matchInfo.winner_id,
      client1_score: matchInfo.user2_score,
      client2_score: matchInfo.user1_score,
    });
    clearInterval(matchInfo.interval);
    const updatedDto : updateDto = await this.saveGameResult(matchInfo);
  }

  private async saveGameResult(
    matchInfo: MatchInfoDto,
  ): Promise<updateDto>{
    console.log('saveGameResult');
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
    const updateDto: updateDto = {
      user1_id: matchInfo.user1.data.uid,
      user2_id: matchInfo.user2.data.uid,
      match_type: matchInfo.matchType,
      user1_score: matchInfo.user1_score,
      user2_score: matchInfo.user2_score,
      user1_elo: player1_new_point,
      user2_elo: player2_new_point,
      winner_id: matchInfo.winner_id,
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
}