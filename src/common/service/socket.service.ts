import { Injectable } from "@nestjs/common";
import { Socket } from "socket.io";
import { Logger } from "@nestjs/common";

@Injectable()
export class SocketService{
  private _socketMap: Map<string, Socket>;
  constructor(){
    this._socketMap = new Map<string, Socket>();
  }

  async addSocket(uid: string, socket: Socket){
    Logger.debug(`[SocketService] addSocket ${uid}`);
    this._socketMap.set(uid, socket);
  }

  async getSocket(uid: string) : Promise<Socket | null>{
    Logger.debug(`[SocketService] getSocket ${uid}`);
    if (!this._socketMap.has(uid))
      return null;
    return this._socketMap.get(uid);
  }

  async removeSocket(uid: string){
    Logger.debug(`[SocketService] removeSocket ${uid}`);
    this._socketMap.delete(uid);
  }
}