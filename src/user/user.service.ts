import {
  BadRequestException,
  Injectable,
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

  async createFriendship(body) {
    const user1 = await this.usersRepository.findOne({
      where: { name: body.user1 },
      relations: ['friendships'],
    });
    const user2 = await this.usersRepository.findOne({
      where: { name: body.user2 },
      relations: ['friendships'],
    });
    if (!user1 || !user2) throw new NotFoundException(`User not found`);

    // Check if the friendship already exists
    const existingFriendship1 = await this.friendshipRepository
      .createQueryBuilder('friendship')
      .where('friendship.user = :userId1 AND friendship.friend = :friendId1', {
        userId1: user1.id,
        friendId1: user2.id,
      })
      .getOne();

    const existingFriendship2 = await this.friendshipRepository
      .createQueryBuilder('friendship')
      .where('friendship.user = :userId2 AND friendship.friend = :friendId2', {
        userId2: user2.id,
        friendId2: user1.id,
      })
      .getOne();

    if (existingFriendship1 || existingFriendship2) {
      throw new BadRequestException('The friendship already exists');
    }

    const friendship1 = new Friendship();
    friendship1.user = user1;
    friendship1.friend = user2;
    await this.friendshipRepository.save(friendship1);

    const friendship2 = new Friendship();
    friendship2.user = user2;
    friendship2.friend = user1;
    await this.friendshipRepository.save(friendship2);

    const friendships = await this.friendshipRepository
      .createQueryBuilder('friendship')
      .leftJoinAndSelect('friendship.user', 'user')
      .leftJoinAndSelect('friendship.friend', 'friend')
      .where('friendship.user = :userId1 AND friendship.friend = :friendId1', {
        userId1: user1.id,
        friendId1: user2.id,
      })
      .orWhere(
        'friendship.user = :userId2 AND friendship.friend = :friendId2',
        {
          userId2: user2.id,
          friendId2: user1.id,
        },
      )
      .select(['friendship.id', 'user.name', 'friend.name'])
      .getMany();

    return friendships;
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
