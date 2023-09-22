import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { dmRepository } from './dm.repository';
import { Socket } from 'socket.io';

@Injectable()
export class DmService {
  private dmSocketMap = new Map<number, Socket>();
  constructor(
    private readonly dmRepository: dmRepository,
  ) { }

  addSocket(socket: Socket) {
    this.dmSocketMap.set(socket.data.uid, socket);
  }

  removeSocket(socket: Socket) {
    this.dmSocketMap.delete(socket.data.uid);
  }

  getSocketByUid(uid: number) {
    return this.dmSocketMap.get(uid);
  }

  async saveDmLog(senderUid : number, payload: { targetUid: number, message: string }) {
    const dm = await this.dmRepository.createNewDm(senderUid, payload).catch((err) => {
      Logger.error(err);
      return null;
    });
    if (!dm) {
      throw new NotFoundException('DM not found');
    }
    const res = await this.dmRepository.save(dm).catch((err) => {
      Logger.error(err);
      return null;
    });
    return res;
  }

  async getMyDMList(userUid: number) {
    const res = await this.dmRepository.findMyDmList(userUid).catch((err) => {
      Logger.error(err);
      return [];
    });
    return res;
  }

  async getDMLogBetween(userUid: number, targetUid: number) {
    const res = await this.dmRepository.findDmLogBetween(userUid, targetUid).catch((err) => {
      Logger.error(err);
      return [];
    });
    return res;
  }

  async postReadDmLog(userUid: number, targetUid: number) {
    const res = await this.dmRepository.readDmLog(userUid, targetUid).catch((err) => {
      Logger.error(err);
      return [];
    });
    return res;
  }
}
