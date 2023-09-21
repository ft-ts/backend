import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/user/entities/user.entity";
import { DM } from "./entities/dm.entity";
import { Repository } from "typeorm";
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

  async createNewDm(senderUid: number, payload: {targetUid: number, message: string }) {
    return this.dmRepository.create({
      sender: await this.userRepository.findOneBy({ uid: senderUid }),
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
    const res = await this.dmRepository
    .createQueryBuilder('dm')
    .leftJoin('dm.sender', 'sender')
    .leftJoin('dm.receiver', 'receiver')
    .select([
      'CASE WHEN sender.uid != :uid THEN sender.uid ELSE receiver.uid END as user_uid',
      'CASE WHEN sender.uid != :uid THEN sender.name ELSE receiver.name END as user_name',
      'CASE WHEN sender.uid != :uid THEN sender.avatar ELSE receiver.avatar END as user_avatar',
      'MAX(dm.created_at) as max_created_at',
      'SUM(CASE WHEN dm.viewed = false AND sender.uid != :uid THEN 1 ELSE 0 END) as unread_count'
    ])
    .where('sender.uid = :uid OR receiver.uid = :uid', { uid: userUid })
    .groupBy('user_uid, user_name, user_avatar')
    .orderBy('max_created_at', 'DESC')
    .getRawMany();
    return res;
  }

  async findDmLogBetween(userUid: number, targetUid: number) {
    const res = await this.dmRepository
    .createQueryBuilder('dm')
    .leftJoinAndSelect('dm.sender', 'sender')
    .leftJoinAndSelect('dm.receiver', 'receiver')
    .select(['dm.id', 'dm.message', 'dm.created_at', 'dm.viewed', 'sender.name', 'sender.uid', 'sender.avatar' ,'receiver.name', 'receiver.uid', 'receiver.avatar'])
    .where('(sender.uid = :uid AND receiver.uid = :targetUid) OR (sender.uid = :targetUid AND receiver.uid = :uid)', { uid: userUid, targetUid })
    .orderBy('dm.created_at', 'ASC')
    .getMany()
    .catch((err) => {
      console.log(err);
      return [];
    });
    return res;
  }

  async findDmLogById(id: number) {
    return await this.dmRepository
      .createQueryBuilder('dm')
      .leftJoinAndSelect('dm.sender', 'sender')
      .leftJoinAndSelect('dm.receiver', 'receiver')
      .select(['dm.id', 'dm.message', 'dm.created_at', 'dm.viewed', 'dm.status', 'sender.name', 'sender.uid', 'receiver.name', 'receiver.uid'])
      .where('dm.id = :id', { id })
      .getOne();
  }

  async readDmLog(userUid: number, targetUid: number) {
    const dmsToUpdate = await this.dmRepository.find({
      where: {
        receiver: { uid: userUid },
        sender: { uid: targetUid },
        viewed: false,
      },
    });
    await Promise.all(
      dmsToUpdate.map(async (dm) => {
        dm.viewed = true;
        await this.dmRepository.save(dm);
      }),
    );
    return dmsToUpdate;
  }
}