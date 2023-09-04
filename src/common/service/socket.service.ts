import { Injectable } from "@nestjs/common";
import { Socket } from "socket.io";
import { Logger } from "@nestjs/common";

@Injectable()
export class SocketService{
  private _socketMap: Map<number, Socket>;
  constructor(){
    Logger.debug(`[SocketService] constructor😭`);
    this._socketMap = new Map<number, Socket>();
  }

  async addSocket(uid: number, socket: Socket){
    Logger.debug(`[SocketService] addSocket ${uid}`);
    this._socketMap.set(uid, socket);

  }

  async getSocket(uid: number) : Promise<Socket | null>{
    Logger.debug(`[SocketService] getSocket ${uid}`);
    if (!this._socketMap.has(uid)){
      Logger.debug(`[SocketService] null`);
      return null;
    }
    return this._socketMap.get(uid);
  }

  async removeSocket(uid: number){
    Logger.debug(`[SocketService] removeSocket ${uid}`);
    this._socketMap.delete(uid);
  }
}