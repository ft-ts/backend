import { Injectable } from "@nestjs/common";
import { Socket } from "socket.io";
import { MatchInfo } from "./dto/pong.dto";
import { GameService } from "./game/game.service";

@Injectable()
export class PongService{
  constructor(
    private readonly gameService: GameService,
    private ladderQueue: Array<Socket> = new Array<Socket>(),
  ){
    console.log('GameService constructor');
    setInterval(() => {
      this.matchLadder();
    }, 1000);
  }

  async createGame(
    client1: Socket,
    client2: Socket,
    matchType: string,
  ){
    console.log('createGame');
    
    const matchInfo: MatchInfo = await this.setMatchInfo(client1, client2, matchType);
    this.gameService.gameStart(client1, client2, matchInfo);
  }
  
  private async setMatchInfo(
    client1: Socket,
    client2: Socket,
    matchType: string,
    ): Promise<MatchInfo>{
    // const matchID: string = Math.random().toString(36).slice(2);
    const matchID: string = `pong_${client1.data.uid}`;
    const matchInfo: MatchInfo = {
      matchID: matchID,
      matchType: matchType,
      user1: client1,
      user2: client2,
      user1_score: 0,
      user2_score: 0,
      user1_elo: 0,
      user2_elo: 0,
      winner_id: '',
      start_date: new Date(),
      interval: null,
    }
    return (matchInfo);
  }

  async joinLadder(
    client: Socket,
  ){
    console.log('joinLadder');
    this.ladderQueue.push(client);
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
    const client1: Socket = this.ladderQueue.shift();
    const client2: Socket = this.ladderQueue.shift();
    if (client1 && client2){
      console.log('match ladder success');
      client2.join(`pong_${client1.data.uid}`);
      await this.createGame(client1, client2, 'ladder');
    }
  }
}