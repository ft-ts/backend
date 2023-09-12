import { Injectable, Logger } from "@nestjs/common";
import { Socket } from "socket.io";
import { GameService } from "./game/game.service";
import { MatchType } from "./pong.enum";
import { UserService } from "src/user/user.service";
import { User } from "src/user/entities/user.entity";

@Injectable()
export class PongService{
  private _ladderQueue: Array<Socket>;

  constructor(
    private readonly gameService: GameService,
  ){
    Logger.debug(`[🏓PongService] constructor`);
    this._ladderQueue = new Array<Socket>();
    setInterval(() => {
      this.matchLadder();
    }, 1000);
  }

  async handleConnection(
    client: Socket,
  ){
    Logger.debug(`[🏓PongService] handleConnection ${client.data.uid}`);
    this.gameService.handleConnection(client);
  }

  async handleDisconnect(
    client: Socket,
  ){
    Logger.debug(`[🏓PongService] handleDisconnect ${client.data.uid}`);
    this.cancleLadder(client);
    this.gameService.handleDisconnect(client);
  }

  async joinLadder(
    client: Socket,
  ){
    Logger.log(`[🏓PongService] joinLadder ${client.data.uid}`);
    const index: number = this._ladderQueue.indexOf(client);
    if (index === -1){
      this._ladderQueue.push(client);
    }
  }

  async cancleLadder(
    client: Socket,
  ){
    const index: number = this._ladderQueue.indexOf(client);
    if (index !== -1){
      Logger.log(`[🏓PongService] cancleLadder ${client.data.uid}`);
      this._ladderQueue.splice(index, 1);
    } else {
      Logger.log(`[🏓PongService] cancleLadder fail ${client.data.uid}`);
    }
  }

  private async matchLadder(
  ){
    if (this._ladderQueue.length >= 2){
      const client1: Socket = this._ladderQueue.shift();
      const client2: Socket = this._ladderQueue.shift();
      if (client1 && client2){
        Logger.log(`[🏓PongService] matchLadder success ${client1.data.uid} ${client2.data.uid}`);
        await this.gameService.createGame(client1, client2, MatchType.LADDER);
      }
    }
  }

  async getUserInfo(
    uid: number,
  ){
    return (this.gameService.getUserInfo(uid));
  }
}