import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/user/entities/user.entity";
import { DM } from "./entities/dm.entity";
import { EntityManager, Repository } from "typeorm";
import { DmType } from "./enum/dm.type";
import { DmStatus } from "./enum/dm-status.enum";
import { Block } from "src/user/entities/block.entity";

@Injectable()
export class dmRepository {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(DM)
    private dmRepository: Repository<DM>,
    @InjectRepository(Block)
    private blockRepository: Repository<Block>,
  ) { }

  async createNewDm(payload: any) {
    return this.dmRepository.create({
      sender: await this.userRepository.findOneBy({ uid: payload.senderUid }),
      receiver: await this.userRepository.findOneBy({ uid: payload.targetUid }),
      message: payload.message,
    });
  }

  async save(dm: DM) {
    return await this.dmRepository.save(dm);
  }

  async update(id: number, payload: any) {
    return await this.dmRepository.update(id, payload);
  }

  async findMyDmList(userUid: number) {
    return await this.dmRepository.query(`
    SELECT t1.id,  t1.message, t1.viewed, t1.created_at,
          u1.intra_id  AS sender_uid, u1.name AS sender_name,
          u2.intra_id  AS receiver_uid, u2.name AS receiver_name
    FROM dm t1
    LEFT JOIN dm t2
          ON (t1."senderId" = t2."receiverId" AND t1."receiverId" = t2."senderId" AND t1.created_at < t2.created_at)
    LEFT JOIN USERS u1
          ON t1."senderId" = u1.id
    LEFT JOIN USERS u2
          ON t1."receiverId" = u2.id
    WHERE t2.id IS NULL
    AND (u1.intra_id = ${userUid} OR u2.intra_id = ${userUid})
    ORDER BY t1.created_at DESC;
    `);
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
    const [sender, receiver] = await Promise.all([
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