import { Injectable } from "@nestjs/common";
import { Socket } from "socket.io";
import { GameService } from "./game/game.service";
import { MatchType } from "./pong.enum";

@Injectable()
export class PongService{
  private _ladderQueue: Array<Socket>;
  constructor(
    private readonly gameService: GameService,
  ){
    console.log('GameService constructor');
    this._ladderQueue = new Array<Socket>();
    setInterval(() => {
      this.matchLadder();
    }, 1000);
  }

  async joinLadder(
    client: Socket,
  ){
    console.log('joinLadder');
    if (this._ladderQueue.indexOf(client) < 0){
      this._ladderQueue.push(client);
    } else {
      client.emit('pong/ladder/join/fail');
    }
  }

  async cancleLadder(
    client: Socket,
  ){
    console.log('cancleLadder');
    const index: number = this._ladderQueue.indexOf(client);
    if (index > -1){
      this._ladderQueue.splice(index, 1);
    }
  }

  private async matchLadder(
  ){
    if (this._ladderQueue.length >= 2){
      const client1: Socket = this._ladderQueue.shift();
      const client2: Socket = this._ladderQueue.shift();
      if (client1 && client2){
        console.log('match ladder success');
        client2.join(`pong_${client1.data.uid}`);
        await this.gameService.createGame(client1, client2, MatchType.LADDER);
      }
    }
  }

  async matchFriend(
    client1: Socket,
    client2: Socket,
  ){
    
  }
}