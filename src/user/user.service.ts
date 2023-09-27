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

  async updateUser(user: User, body: Partial<User>) {

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

  async findAllExceptMe(user: User) {
    const res = await this.usersRepository.find({
      where: { uid: Not(user.uid)},
      select: [
        'uid',
        'name',
        'avatar',
        'status',
        'rating',
        'custom_wins',
        'custom_losses',
        'ladder_wins',
        'ladder_losses',
      ],
      order: { uid: 'ASC' },
    }).catch((err) => {
      Logger.error(err);
      throw new BadRequestException('Cannot find users');
    });
    return res;
  }


  async findFriends(user: User) {
    const friends = await this.friendshipRepository
      .createQueryBuilder('friendship')
      .leftJoinAndSelect('friendship.user', 'user')
      .leftJoinAndSelect('friendship.friend', 'friend')
      .where('user.uid = :uid', { uid: user.uid, })
      .select(['friendship.id', 'user.name', 'user.uid', 'friend'])
      .getMany()
      .catch((err) => {
        Logger.error(err);
        throw new BadRequestException('Cannot find friends');
      });
    return friends.map((friendship) => friendship.friend);
  }

  async findOne(uid: number) {
    const user = await this.usersRepository.findOne({
      where: { uid: uid},
    }).catch((err) => {
      Logger.error(err);
      throw new BadRequestException('Cannot find user');
    });
    const blocked = await this.findBlocked(user).catch((err) => {
      Logger.error(err);
      throw new BadRequestException('Cannot find blocked');
    });
    const partialUser: Partial<User> = {
      uid: user.uid,
      name: user.name,
      avatar: user.avatar,
      rating: user.rating,
      custom_wins: user.custom_wins,
      custom_losses: user.custom_losses,
      ladder_wins: user.ladder_wins,
      ladder_losses: user.ladder_losses,
      status: user.status,
      blocked: blocked,
    }
    console.log('status', user.status);
    Logger.error('status :', user.status)
    return partialUser;
  }

  async createFriendship(userUid: number, targetUid: number): Promise<{}> {
    if (userUid === targetUid) throw new BadRequestException('Cannot add yourself as a friend');
    const user = await this.usersRepository.findOne({
      where: { uid: userUid },
      relations: ['friendships'],
    });
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
      .getOne()
      .catch((err) => {
        Logger.error(err);
        throw new BadRequestException('Cannot find friendship');
      });
    if (existingFriendship) {
      //return exception
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
      .getOne()
      .catch((err) => {
        Logger.error(err);
        throw new NotFoundException(`Friendship not found`);
      });
    return await this.friendshipRepository.delete(friendship.id);
  }

  /**
   * @Blocked
   */
  private async findBlocked(user: User) {
    const res = await this.blockRepository
      .createQueryBuilder('block')
      .leftJoinAndSelect('block.user', 'user')
      .leftJoinAndSelect('block.blocked', 'blocked')
      .where('user.uid = :uid', {
        uid: user.uid,
      })
      .select(['block.id', 'user.name', 'user.uid', 'blocked.name', 'blocked.uid'])
      .getMany()
      .catch((err) => {
        Logger.error(err);
        throw new BadRequestException('Cannot find blocked');
      });
    return res;
  }

  async createBlocked(userUid: number, targetUid: number) {
    if (userUid === targetUid) throw new BadRequestException('Cannot block yourself');
    const user = await this.usersRepository.findOne({
      where: { uid: userUid },
      relations: ['blocked'],
    });
    const user2 = await this.usersRepository.findOne({
      where: { uid: targetUid },
      relations: ['blocked'],
    });
    if (!user || !user2) throw new NotFoundException(`User not found`);
    const blockCheck: boolean = await this.checkBlocked(userUid, targetUid)
    .catch((err) => {
      Logger.error(err);
      throw new BadRequestException('Cannot find blocked');
    });
    if (blockCheck) throw new BadRequestException('The blocked already exists');
    const blocked = this.blockRepository.create({
      user: user,
      blocked: user2,
    });
    await this.blockRepository.save(blocked);
    return targetUid;
  }

  async deleteBlocked(userUid: number, targetUid: number) {
    const blocked = await this.blockRepository
      .createQueryBuilder('block')
      .leftJoinAndSelect('block.user', 'user')
      .leftJoinAndSelect('block.blocked', 'blocked')
      .where('(user.uid = :uid AND blocked.uid = :blockedUid)', {
        uid: userUid,
        blockedUid: targetUid,
      })
      .getOne()
      .catch((err) => {
        Logger.error(err);
        throw new NotFoundException(`Blocked not found`);
      });
    if (!blocked) throw new NotFoundException(`Blocked not found`);
    await this.blockRepository.delete(blocked.id);
    return targetUid;
  }
  
  async checkBlocked(senderUid: number, targetUid: number) {
    const result = await this.blockRepository
      .createQueryBuilder('block')
      .leftJoinAndSelect('block.user', 'user')
      .leftJoinAndSelect('block.blocked', 'blocked')
      .select(['block.id', 'user.uid', 'blocked.uid'])
      .where('user.uid = :targetUid', { targetUid })
      .andWhere('blocked.uid = :senderUid', { senderUid })
      .getOne()
      .catch((err) => {
        Logger.error(err);
        throw new BadRequestException('Cannot find blocked');
      });
    if (result)
      return true;
    return false;
  }
}
