import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { User } from './entities/user.entity';
import { Friendship } from './entities/friendship.entity';
import { UserRepository } from './repositories/user.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Block } from './entities/block.entity';

@Injectable()
export class UserService {
  constructor(
    private readonly usersRepository: UserRepository,
    @InjectRepository(Friendship)
    private readonly friendshipRepository: Repository<Friendship>,
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
  ) { }

  async updateUser(user: User, body: any) {

    if (!body || !(body.twoFactorAuth || body.name || body.avatar))
      throw new BadRequestException('Body is undefined');

    if (body.uid || body.email)
      throw new BadRequestException('Cannot change uid or email');

    if (body.name) {
      if (body.name.length < 3 || body.name.length > 10)
        throw new BadRequestException('Name must be between 3 and 10 characters');

      const isExist = await this.usersRepository.findOneBy({ name: body.name });
      if (isExist)
        return new BadRequestException('Name already exists');
    }

    await this.usersRepository.update({ uid: user.uid }, body);
    return await this.usersRepository.findOneBy({ uid: user.uid });
  }

  async findAll() {
    return await this.usersRepository.find({ order: { uid: 'ASC' } });
  }

  async findAllExceptMe(user: User) {
    return await this.usersRepository.find({
      where: { uid: Not(user.uid) },
      order: { uid: 'ASC' },
    });
  }

  async findChannelUsers() {
    return `This action returns all users in channel`;
  }

  async findFriends(user: User) {
    const friends = await this.friendshipRepository
      .createQueryBuilder('friendship')
      .leftJoinAndSelect('friendship.user', 'user')
      .leftJoinAndSelect('friendship.friend', 'friend')
      .where('user.uid = :uid', { uid: user.uid, })
      .select(['friendship.id', 'user.name', 'user.uid', 'friend'])
      .getMany();

    return friends.map((friendship) => friendship.friend);
  }

  async findOne(uid: number) {
    const user = await this.usersRepository.findOneBy({ uid });
    if (!user)
      throw new NotFoundException(`User not found`);
    return user;
  }

  /**
   * [ 친구 요청 ] 단방향
   * 1. 이미 친구인지 확인
   * @FAIL : 이미 친구입니다.
   * 
   * 2. 없으면 새로운 친구 요청을 생성한다.
   * @SUCCESS : 친구 요청 성공.
   */
  async createFriendship(userInfo, targetUid): Promise<{}> {
    const user = await this.usersRepository.findOne({
      where: { uid: userInfo.uid },
      relations: ['friendships'],
    });

    if (user.uid === targetUid) throw new BadRequestException('Cannot add yourself as a friend');

    const user2 = await this.usersRepository.findOne({
      where: { uid: targetUid },
      relations: ['friendships'],
    });

    if (!user || !user2) throw new NotFoundException(`User not found`);

    const existingFriendship = await this.friendshipRepository
      .createQueryBuilder('friendship')
      .where('friendship.user = :userId AND friendship.friend = :friendId', {
        userId: user.id,
        friendId: user2.id,
      })
      .getOne();
    if (existingFriendship) {
      throw new BadRequestException('The friendship already exists');
    }

    const friendship = this.friendshipRepository.create({
      user: user,
      friend: user2,
    });
    await this.friendshipRepository.save(friendship);

    const friendships = await this.findFriends(user);
    return friendships;
  }

  async deleteFriendship(userInfo, targetUid) {
    const friendship = await this.friendshipRepository
      .createQueryBuilder('friendship')
      .leftJoinAndSelect('friendship.user', 'user')
      .leftJoinAndSelect('friendship.friend', 'friend')
      .where('(user.uid = :uid AND friend.uid = :friendUid)', {
        uid: userInfo.uid,
        friendUid: targetUid,
      })
      .getOne();
    if (!friendship) throw new NotFoundException(`Friendship not found`);

    Logger.debug(`[UserService deleteFriendship] ${friendship.user.name}(${friendship.user.uid})와 ${friendship.friend.name}(${friendship.friend.uid})의 친구관계를 삭제합니다.`);
    return await this.friendshipRepository.delete(friendship.id);
  }

  /**
   * @Blocked
   */
  async findBlocked(user: User) {
    return await this.blockRepository
      .createQueryBuilder('block')
      .leftJoinAndSelect('block.user', 'user')
      .leftJoinAndSelect('block.blocked', 'blocked')
      .where('user.uid = :uid', {
        uid: user.uid,
      })
      .select(['block.id', 'user.name', 'user.uid', 'blocked.name', 'blocked.uid'])
      .getMany();
  }

  async findAllBlocked() {
    return await this.blockRepository
      .createQueryBuilder('block')
      .leftJoinAndSelect('block.user', 'user')
      .leftJoinAndSelect('block.blocked', 'blocked')
      .select(['block.id', 'user.name', 'user.uid', 'blocked.name', 'blocked.uid'])
      .getMany();
  }

  async createBlocked(userInfo, targetUid): Promise<{}> {
    const user = await this.usersRepository.findOne({
      where: { uid: userInfo.uid },
      relations: ['blocked'],
    });

    if (user.uid === targetUid) throw new BadRequestException('Cannot block yourself');

    const user2 = await this.usersRepository.findOne({
      where: { uid: targetUid },
      relations: ['blocked'],
    });
    if (!user || !user2) throw new NotFoundException(`User not found`);

    const existingBlocked = await this.blockRepository
      .createQueryBuilder('block')
      .where('block.user = :userId AND block.blocked = :blockedId', {
        userId: user.id,
        blockedId: user2.id,
      })
      .getOne();

    if (existingBlocked) {
      throw new BadRequestException('The blocked already exists');
    }

    const blocked = this.blockRepository.create({
      user: user,
      blocked: user2,
    });
    await this.blockRepository.save(blocked);

    const blocks = await this.blockRepository
      .createQueryBuilder('block')
      .leftJoinAndSelect('block.user', 'user')
      .leftJoinAndSelect('block.blocked', 'blocked')
      .where('block.user = :userId AND block.blocked = :blockedId', {
        userId: user.id,
        blockedId: user2.id,
      })
      .select(['block.id', 'user.name', 'blocked.name'])
      .getMany();

    return blocks;
  }

  async deleteBlocked(userInfo, targetUid) {
    const blocked = await this.blockRepository
      .createQueryBuilder('block')
      .leftJoinAndSelect('block.user', 'user')
      .leftJoinAndSelect('block.blocked', 'blocked')
      .where('(user.uid = :uid AND blocked.uid = :blockedUid)', {
        uid: userInfo.uid,
        blockedUid: targetUid,
      })
      .getOne();
    if (!blocked) throw new NotFoundException(`Blocked not found`);

    Logger.debug(`[UserService deleteBlocked] ${blocked.user.name}(${blocked.user.uid})가 ${blocked.blocked.name}(${blocked.blocked.uid})에 대한 차단을 해제합니다.`);
    return await this.blockRepository.delete(blocked.id);
  }

  async checkBlocked(senderUid: number, targetUid: number) {
    const result = await this.blockRepository
      .createQueryBuilder('block')
      .leftJoinAndSelect('block.user', 'user')
      .leftJoinAndSelect('block.blocked', 'blocked')
      .select(['block.id', 'user.uid', 'blocked.uid'])
      .where('user.uid = :targetUid', { targetUid })
      .andWhere('blocked.uid = :senderUid', { senderUid })
      .getOne();
    if (result)
      return true;
    return false;
  }
}
