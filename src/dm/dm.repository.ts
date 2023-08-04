import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/user/entities/user.entity";
import { DM } from "./entities/dm.entity";
import { Repository } from "typeorm";
import { DmType } from "./enum/dm.type";
import { DmStatus } from "./enum/dm-status.enum";

@Injectable()
export class dmRepository {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(DM)
    private dmRepository: Repository<DM>,
  ) { }

  async createNewDm(payload: any) {
    return this.dmRepository.create({
      sender: await this.userRepository.findOneBy({ uid: payload.senderUid }),
      receiver: await this.userRepository.findOneBy({ uid: payload.receiverUid }),
      message: payload.message,
    });
  }

  async save(dm: DM) {
    return await this.dmRepository.save(dm);
  }

  async update(id: number, payload: any) {
    return await this.dmRepository.update(id, payload);
  }

  async findAllDmLog(userUid: number) {
    return await this.dmRepository
      .createQueryBuilder('dm')
      .leftJoinAndSelect('dm.sender', 'sender')
      .leftJoinAndSelect('dm.receiver', 'receiver')
      .select(['dm.id', 'dm.message', 'dm.createdAt', 'dm.viewed', 'dm.status', 'dm.type', 'sender.name', 'sender.uid', 'receiver.name', 'receiver.uid'])
      .where('sender.uid = :uid', { uid: userUid })
      .orWhere('receiver.uid = :uid', { uid: userUid })
      .orderBy('dm.createdAt', 'DESC')
      .getMany();
  }

  async findUserBy(payload: any) {
    return await this.userRepository.findOneBy(payload);
  }

  async findDmLogBetween(userUid: number, targetUid: number) {
    return await this.dmRepository
      .createQueryBuilder('dm')
      .leftJoinAndSelect('dm.sender', 'sender')
      .leftJoinAndSelect('dm.receiver', 'receiver')
      .select(['dm.id', 'dm.message', 'dm.createdAt', 'dm.viewed', 'dm.type', 'sender.name', 'sender.uid', 'receiver.name', 'receiver.uid'])
      .where('sender.uid = :uid', { uid: userUid })
      .andWhere('receiver.uid = :targetUid', { targetUid })
      .orWhere('sender.uid = :targetUid', { targetUid })
      .andWhere('receiver.uid = :uid', { uid: userUid })
      .orderBy('dm.createdAt', 'DESC')
      .getMany();
  }

  async findDmLogById(id: number) {
    return await this.dmRepository
      .createQueryBuilder('dm')
      .leftJoinAndSelect('dm.sender', 'sender')
      .leftJoinAndSelect('dm.receiver', 'receiver')
      .select(['dm.id', 'dm.message', 'dm.created_at', 'dm.viewed', 'dm.type', 'dm.status', 'sender.name', 'sender.uid', 'receiver.name', 'receiver.uid'])
      .where('dm.id = :id', { id })
      .getOne();
  }

  async findPendingRequests(userUid: number) {
    return await this.dmRepository
      .createQueryBuilder('dm')
      .leftJoinAndSelect('dm.sender', 'sender')
      .leftJoinAndSelect('dm.receiver', 'receiver')
      .select(['dm.id', 'dm.message', 'dm.createdAt', 'dm.viewed', 'dm.type', 'dm.status', 'sender.name', 'sender.uid', 'receiver.name', 'receiver.uid'])
      .where('receiver.uid = :uid', { uid: userUid })
      .andWhere('dm.status = :pending', { pending: DmStatus.PENDING })
      .getMany();
  }

  async findMatchRequestStatus(payload: any) {
    const result = await this.dmRepository
      .createQueryBuilder('dm')
      .leftJoinAndSelect('dm.sender', 'sender')
      .leftJoinAndSelect('dm.receiver', 'receiver')
      .select([
        'dm.id',
        'dm.message',
        'dm.createdAt',
        'dm.viewed',
        'dm.type',
        'dm.status',
        'sender.name',
        'sender.uid',
        'receiver.name',
        'receiver.uid'
      ])
      .where('dm.status = :pending', { pending: DmStatus.PENDING })
      .andWhere('sender.uid = :senderUid', { senderUid: payload.senderUid })
      .andWhere('dm.type = :type', { type: DmType.MATCH })
      .getOne();
    return result;
  }

  async createNewMatchRequest(payload: any) {
    const [ sender, receiver ] = await Promise.all([
      this.userRepository.findOneBy({ uid: payload.senderUid }),
      this.userRepository.findOneBy({ uid: payload.receiverUid }),
    ]);
    const dm = this.dmRepository.create({
      sender,
      receiver,
      message: `${sender.name}님이 매치 요청을 보냈습니다.`,
      type: DmType.MATCH,
      status: DmStatus.PENDING,
    });
    return dm;
  }
}