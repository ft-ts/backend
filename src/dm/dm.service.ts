import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { dmRepository } from './dm.repository';

@Injectable()
export class DmService {
  constructor(
    private readonly dmRepository: dmRepository,
  ) { }

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
