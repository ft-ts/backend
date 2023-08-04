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
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    private readonly usersRepository: UserRepository,
    @InjectRepository(Friendship)
    private readonly friendshipRepository: Repository<Friendship>,
  ) { }

  async updateUser(user: User, body) {
    if (body.uid || body.email)
      throw new BadRequestException('Cannot change uid or email');

    // email, avatar, status 유효성 검사
    if (body.name.length < 4 || body.name.length > 20)
      throw new BadRequestException('Name must be between 4 and 20 characters');

    await this.usersRepository.update(user.id, body);
    return await this.usersRepository.findOneBy({ id: user.id });
  }

  async findAll() {
    return await this.usersRepository.find();
  }

  async findChannelUsers() {
    return `This action returns all users in channel`;
  }

  async findFriends(user: User) {
    return await this.friendshipRepository
      .createQueryBuilder('friendship')
      .leftJoinAndSelect('friendship.user', 'user')
      .leftJoinAndSelect('friendship.friend', 'friend')
      .where('user.uid = :uid', {
        uid: user.uid,
      })
      .select(['friendship.id', 'user.name', 'user.uid', 'friend.name', 'friend.uid'])
      .getMany();
  }

  async findOne(uid: number) {
    const user = await this.usersRepository.findOneBy({ uid });
    if (!user) throw new NotFoundException(`User ${uid} not found`);
    return {
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      status: user.status,
    };
  }

  /**
   * [ 친구 요청 ] 단방향
   * 1. 이미 친구인지 확인
   * @FAIL : 이미 친구입니다.
   * 
   * 2. 없으면 새로운 친구 요청을 생성한다.
   * @SUCCESS : 친구 요청 성공.
   */
  async createFriendship(userInfo, body): Promise<{}> {
    const user = await this.usersRepository.findOne({
      where: { uid: userInfo.uid },
      relations: ['friendships'],
    });
    const user2 = await this.usersRepository.findOne({
      where: { name: body.user2 },
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

    const friendships = await this.friendshipRepository
      .createQueryBuilder('friendship')
      .leftJoinAndSelect('friendship.user', 'user')
      .leftJoinAndSelect('friendship.friend', 'friend')
      .where('friendship.user = :userId AND friendship.friend = :friendId', {
        userId: user.id,
        friendId: user2.id,
      })
      .select(['friendship.id', 'user.name', 'friend.name'])
      .getMany();

    return friendships;
  }

  // 친구 추가 uid로 고치기
  async deleteFriendship(userInfo, body) {
    const { targetUid } = body;
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

    Logger.log(`[UserService deleteFriendship] ${friendship.user.name}(${friendship.user.uid})와 ${friendship.friend.name}(${friendship.friend.uid})의 친구관계를 삭제합니다.`);
    return await this.friendshipRepository.delete(friendship.id);
  }


  async findAllFriendships() {
    return await this.friendshipRepository
      .createQueryBuilder('friendship')
      .leftJoinAndSelect('friendship.user', 'user')
      .leftJoinAndSelect('friendship.friend', 'friend')
      .select(['friendship.id', 'user.name', 'user.uid', 'friend.name', 'friend.uid',])
      .getMany();
  }
}
