import { Injectable, Logger } from '@nestjs/common';
import { DmType } from './enum/DM.enum';
import { dmRepository } from './dm.repository';
import { DM } from './entities/dm.entity';
import { DmStatus } from './enum/dm-status.enum';

@Injectable()
export class DmService {
  constructor(
    private readonly dmRepository: dmRepository,
  ) { }

  async saveDmLog(payload: any) {
    console.log('dm/saveDmLog', payload);
    const dm = await this.dmRepository.createNewDm(payload);
    return await this.dmRepository.save(dm);
  }

  async getAllMyDmLog(userUid: number) {
    const result = await this.dmRepository.findAllDmLog(userUid);
    return result;
  }

  async getDMLogBetween(userUid: number, targetName: string) {
    const target = await this.dmRepository.findUserBy({ name: targetName });
    if (!target) {
      return null;
    }
    const result = await this.dmRepository.findDmLogBetween(userUid, target.uid);

    return result;
  }

  async handleFriendRequest(payload: any): Promise<{ message: string, result: string, data: any }> {

    // 친구관계를 먼저 조회
    const friendship = await this.dmRepository.findFriendShipBetween(payload.senderUid, payload.receiverUid);
    if (friendship) {
      const message = `[${friendship.user.name}, ${friendship.friend.name}] 이미 친구입니다.`;
      Logger.warn(message);

      return { message, result: 'FAILED', data: friendship };
    }

    const friendRequest = await this.dmRepository.findFriendRequestStatus(payload);
    if (friendRequest) {
      const message = `[${friendRequest.sender.name} -> ${friendRequest.receiver.name}] 이미 친구 요청이 진행중입니다.`;
      Logger.warn(message);

      return { message, result: 'FAILED', data: friendRequest };
    }
    const dm = await this.dmRepository.createNewFriendRequest(payload);
    const result = await this.dmRepository.save(dm);

    return { message: `친구 요청 성공.`, result: 'SUCCESS', data: await this.dmRepository.findDmLogById(result.id) };
  }

  async handleResponse(payload: any) {
    const { requestDmId, response, senderUid } = payload;

    const dm = await this.dmRepository.findDmLogById(requestDmId);
    if (!dm) {
      Logger.warn(`[${senderUid}] 해당 요청이 존재하지 않습니다.`);
      return { message: '해당 요청이 존재하지 않습니다.', result: 'FAILED' };
    }
    if (dm.status !== DmStatus.PENDING) {
      Logger.warn(`[${senderUid}] 해당 요청이 이미 처리되었습니다.`);
      return { message: '해당 요청이 이미 처리되었습니다.', result: 'FAILED' };
    }
    if (response === 'ACCEPT') {
      
      if (dm.type === DmType.FRIEND) {
        await this.dmRepository.createNewFriendShip(dm);
      } else if (dm.type === DmType.MATCH) {
        console.log('매치 요청을 수락했습니다.');
      }

      dm.status = DmStatus.ACCEPTED;
      await this.dmRepository.save(dm);
      Logger.log(`[${senderUid}] 요청을 수락했습니다.`);

      return { message: ' 요청을 수락했습니다.', result: 'ACCEPTED' };
    } else if (response === 'REJECT') {
      dm.status = DmStatus.REJECTED;
      await this.dmRepository.save(dm);
      Logger.log(`[${senderUid}] 요청을 거절했습니다.`);

      return { message: ' 요청을 거절했습니다.', result: 'REJECTED' };
    }
  }

  async getPendingRequests(userUid: number) {
    const result = await this.dmRepository.findPendingRequests(userUid);
    return result;
  }

  async cancelFriendRequest(payload: any) {
    const { requestDmId, senderUid } = payload;

    const dm = await this.dmRepository.findDmLogById(requestDmId);
    if (!dm) {
      Logger.warn(`[${senderUid}] 해당 요청이 존재하지 않습니다.`);
      return { message: '해당 요청이 존재하지 않습니다.', result: 'FAILED' };
    }
    if (dm.status !== DmStatus.PENDING) {
      Logger.warn(`[${senderUid}] 해당 요청이 이미 처리되었습니다.`);
      return { message: '해당 요청이 이미 처리되었습니다.', result: 'FAILED' };
    }

    dm.status = DmStatus.CANCELED;
    await this.dmRepository.save(dm);
    Logger.log(`[${senderUid}] 요청을 취소했습니다.`);

    return { message: ' 요청을 취소했습니다.', result: 'CANCELED' };
  }
}
