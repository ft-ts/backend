import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DmType } from './enum/dm.type';
import { dmRepository } from './dm.repository';
import { DmStatus } from './enum/dm-status.enum';
import { DmResultType } from './enum/dm.result';
import { UserStatus } from 'src/user/enums/userStatus.enum';

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

  async getMyDMList(userUid: number) {
    const result = await this.dmRepository.findMyDmList(userUid);
    return result;
  }

  async getDMLogBetween(userUid: number, targetUid: number) {
    return await this.dmRepository.findDmLogBetween(userUid, targetUid);
  }

  async getAllDmLog(userUid: number) {
    return await this.dmRepository.findAllDmLog(userUid);
  }

  async handleResponse(payload: any): Promise<{ result: DmResultType, reason: string }> {
    const { requestDmId, response, senderUid } = payload;

    const dm = await this.dmRepository.findDmLogById(requestDmId);
    if (!dm) {
      Logger.warn(`[${senderUid}] 해당 요청(${dm.id})이 존재하지 않습니다.`);
      return { result: DmResultType.FAIL, reason: '해당 요청이 존재하지 않습니다.' };
    }
    if (dm.status !== DmStatus.PENDING) {
      Logger.warn(`[${senderUid}] 해당 요청(${dm.id})이 이미 처리되었습니다.`);
      return { result: DmResultType.FAIL, reason: '해당 요청이 이미 처리되었습니다.' };
    }
    if (response === 'ACCEPT') {
      if (dm.type === DmType.MATCH) {
        console.log('매치 요청을 수락했습니다.');
      }

      dm.status = DmStatus.ACCEPTED;
      await this.dmRepository.update(dm.id, { status: dm.status });
      Logger.debug(`${dm.receiver.name}(${dm.receiver.uid})가 ${dm.sender.name}(${dm.sender.uid})의 ${dm.type} 요청(${dm.id})을 수락했습니다.`);

      return { reason: '요청을 수락했습니다.', result: DmResultType.SUCCESS };
    } else if (response === 'REJECT') {
      dm.status = DmStatus.REJECTED;
      await this.dmRepository.update(dm.id, { status: dm.status });
      Logger.debug(`[${senderUid}] 요청을 거절했습니다.`);

      return { reason: '요청을 거절했습니다.', result: DmResultType.SUCCESS };
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
    await this.dmRepository.update(dm.id, { status: dm.status });
    Logger.debug(`[${senderUid}] 요청을 취소했습니다.`);

    return { message: ' 요청을 취소했습니다.', result: 'CANCELED' };
  }

  /**
   *  매치 요청을 처리합니다.
   * 1. 신청자의 dm에서 진행중인 매치 요청을 찾는다.
   *  
   * 2. 이미 나한테 진행중인 매치 요청이 하나라도 있으면 실패 
   * @FAIL : 이미 진행중인 매치 요청이 있습니다.
   * 
   * 3. 상대방이 게임중이면 실패
   * @FAIL : 상대방이 게임중입니다.
   * 
   * 4. 없으면 새로운 매치 요청을 생성한다.
   * @SUCCESS : 매치 요청 성공.
   */
  async handleMatchRequest(payload: any): Promise<{ result: DmResultType, reason: string, data: any }> {

    const matchRequest = await this.dmRepository.findMatchRequestStatus(payload);
    if (matchRequest) {
      Logger.warn(`[${matchRequest.sender.name} -> ${matchRequest.receiver.name}] 이미 매치 요청이 진행중입니다.`);

      return { 
        result: DmResultType.FAIL, 
        reason: '이미 매치 요청이 진행중입니다.',
        data: matchRequest 
      };
    }

    const receiver = await this.dmRepository.findUserBy({ uid: payload.receiverUid });
    if (receiver.status !== UserStatus.ONLINE) {
      Logger.warn(`상대방 상태 : [${receiver.status}]`);
      return {
        result: DmResultType.FAIL,
        reason: `상대방 상태 : [${receiver.status}]`,
        data: receiver,
      };
    }

    const dm = await this.dmRepository.createNewMatchRequest(payload);
    const result = await this.dmRepository.save(dm);

    return {
      result: DmResultType.SUCCESS,
      reason: `매치 요청 성공.`,
      data: await this.dmRepository.findDmLogById(result.id) 
    };
  }
}
