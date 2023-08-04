import { Injectable } from "@nestjs/common";
import { Socket } from "socket.io";
import { MatchInfoDto } from "./dto/pong.dto";
import { GameService } from "./game/game.service";
import { MatchType } from "./enum/matchType.enum";

@Injectable()
export class PongService{
  private ladderQueue: Array<Socket>;
  constructor(
    private readonly gameService: GameService,
  ){
    console.log('GameService constructor');
    this.ladderQueue = new Array<Socket>();
    setInterval(() => {
      this.matchLadder();
    }, 1000);
  }

  async createGame(
    client1: Socket,
    client2: Socket,
    matchType: MatchType,
  ){
    console.log('createGame');
    
    const matchInfo: MatchInfoDto = await this.setMatchInfo(client1, client2, matchType);
    this.gameService.gameStart(client1, client2, matchInfo);
  }
  
  private async setMatchInfo(
    client1: Socket,
    client2: Socket,
    matchType: MatchType,
    ): Promise<MatchInfoDto>{
    const matchID: string = Math.random().toString(36).slice(2);
    const matchInfo: MatchInfoDto = {
      matchID: matchID,
      matchType: matchType,
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
    }
    return (matchInfo);
  }

  async joinLadder(
    client: Socket,
  ){
    console.log('joinLadder');
    if (this.ladderQueue.indexOf(client) < 0){
      this.ladderQueue.push(client);
    } else {
      client.emit('pong/ladder/join/fail');
    }
  }

  async cancleLadder(
    client: Socket,
  ){
    console.log('cancleLadder');
    const index: number = this.ladderQueue.indexOf(client);
    if (index > -1){
      this.ladderQueue.splice(index, 1);
    }
  }

  private async matchLadder(
  ){
    if (this.ladderQueue.length >= 2){
      const client1: Socket = this.ladderQueue.shift();
      const client2: Socket = this.ladderQueue.shift();
      if (client1 && client2){
        console.log('match ladder success');
        client2.join(`pong_${client1.data.uid}`);
        await this.createGame(client1, client2, MatchType.LADDER);
      }
    }
  }
}