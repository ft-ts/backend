import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { DM } from './entities/dm.entity';
import { Socket } from 'socket.io';

enum DmType {
  DM,
  NOTIFICATION,
}

@Injectable()
export class DmService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(DM)
    private dmRepository: Repository<DM>,
  ) {}

  async saveDmLog(payload: any) {
    console.log('dm/saveDmLog', payload);
    const dm = this.dmRepository.create(
      {
        sender : await this.userRepository.findOneBy({ uid : payload.senderUid}),
        receiver : await this.userRepository.findOneBy({ uid : payload.receiverUid }),
        message : payload.message,
        createdAt : new Date(),
      }
    );
    return await this.dmRepository.save(dm);
  }

  async getAllDmLog(userUid: number) {
    const result = await this.dmRepository
    .createQueryBuilder('dm')
    .leftJoinAndSelect('dm.sender', 'sender')
    .leftJoinAndSelect('dm.receiver', 'receiver')
    .select(['dm.id', 'dm.message', 'dm.createdAt', 'dm.viewed', 'dm.type', 'sender.name', 'sender.uid', 'receiver.name', 'receiver.uid'])
    .where('sender.uid = :uid', { uid : userUid })
    .orWhere('receiver.uid = :uid', { uid : userUid })
    .orderBy('dm.createdAt', 'DESC')
    .getMany();
    return result;
  }

  async getDMLogBetween(userUid: number, targetName: string) {
    const target = await this.userRepository.findOneBy({ name : targetName });
    if (!target) {
      return null;
    }
    const result = await this.dmRepository
    .createQueryBuilder('dm')
    .leftJoinAndSelect('dm.sender', 'sender')
    .leftJoinAndSelect('dm.receiver', 'receiver')
    .select(['dm.id', 'dm.message', 'dm.createdAt', 'dm.viewed', 'dm.type', 'sender.name', 'sender.uid', 'receiver.name', 'receiver.uid'])
    .where('sender.uid = :uid', { uid : userUid })
    .andWhere('receiver.uid = :targetUid', { targetUid : target.uid })
    .orWhere('sender.uid = :targetUid', { targetUid : target.uid })
    .andWhere('receiver.uid = :uid', { uid : userUid })
    .orderBy('dm.createdAt', 'DESC')
    .getMany();
    return result;
  }

}
