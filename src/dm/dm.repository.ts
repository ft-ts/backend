import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/user/entities/user.entity";
import { DM } from "./entities/dm.entity";
import { Repository } from "typeorm";
import { DmType } from "./enum/DM.enum";
import { DmStatus } from "./enum/dm-status.enum";
import { Friendship } from "src/user/entities/friendship.entity";

@Injectable()
export class dmRepository {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Friendship)
    private friendshipRepository: Repository<Friendship>,
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

  async findFriendRequestStatus(payload: any) {
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
      .andWhere('(sender.uid = :senderUid AND receiver.uid = :receiverUid) OR (receiver.uid = :senderUid AND sender.uid = :receiverUid)', {
        senderUid: payload.senderUid,
        receiverUid: payload.receiverUid
      })
      .andWhere('dm.type = :type', { type: DmType.FRIEND })
      .getOne();
      console.log(result);
    return result;
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

  async createNewFriendRequest(payload: any) {
    const [ sender, receiver ] = await Promise.all([
      this.userRepository.findOneBy({ uid: payload.senderUid }),
      this.userRepository.findOneBy({ uid: payload.receiverUid }),
    ]);
    console.log(sender, receiver);
    const dm = this.dmRepository.create({
      sender,
      receiver,
      message: `${sender.name}님이 친구 요청을 보냈습니다.`,
      type: DmType.FRIEND,
      status: DmStatus.PENDING,
    });
    return dm;
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

  async findFriendShipBetween(userUid: number, targetUid: number) {
    return await this.friendshipRepository
      .createQueryBuilder('friendship')
      .leftJoinAndSelect('friendship.user', 'user')
      .leftJoinAndSelect('friendship.friend', 'friend')
      .select(['friendship.id', 'user.name', 'user.uid', 'friend.name', 'friend.uid'])
      .where('(user.uid = :userUid AND friend.uid = :targetUid) OR (friend.uid = :userUid AND user.uid = :targetUid)', {
        userUid,
        targetUid,
      })
      .getOne();
  }

  async findPendingRequests(userUid: number) {
    return await this.dmRepository
      .createQueryBuilder('dm')
      .leftJoinAndSelect('dm.sender', 'sender')
      .leftJoinAndSelect('dm.receiver', 'receiver')
      .select(['dm.id', 'dm.message', 'dm.createdAt', 'dm.viewed', 'dm.type', 'dm.status', 'sender.name', 'sender.uid', 'receiver.name', 'receiver.uid'])
      .where('receiver.uid = :uid', { uid: userUid })
      .andWhere('dm.type = :type', { type: DmType.FRIEND })
      .andWhere('dm.status = :pending', { pending: DmStatus.PENDING })
      .getMany();
  }

  async createNewFriendShip(dm: DM) {
    const { sender, receiver } = dm;
    const [ user, friend ] = await Promise.all([
      this.userRepository.findOneBy({ uid: sender.uid }),
      this.userRepository.findOneBy({ uid: receiver.uid }),
    ]);
    const friendship = this.friendshipRepository.create({
      user,
      friend,
    });
    const reverseFriendship = this.friendshipRepository.create({
      user: friend,
      friend: user,
    });
    this.friendshipRepository.save(friendship);
    this.friendshipRepository.save(reverseFriendship);
  }
}