import { Injectable } from '@nestjs/common';
import { Not, Repository } from 'typeorm';
import { CreateChannelDto } from './dto/create-channel.dto';

import { ChannelMode } from './enum/channelMode.enum';
import { ChannelRole } from './enum/channelRole.enum';
import { User } from 'src/user/entities/user.entity';
import { Channel } from './entities/channel.entity';
import { ChannelUser } from './entities';
import { InjectRepository } from '@nestjs/typeorm';
import { MissingPasswordException, NotAuthorizedException, NotFoundException } from 'src/common/exceptions/chat.exception';
import { Cm } from './entities/cm.entity';

@Injectable()
export class ChannelService {
  constructor(
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
    @InjectRepository(Cm)
    private cmRepository: Repository<Cm>,
    @InjectRepository(ChannelUser)
    private channelUserRepository: Repository<ChannelUser>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /* ==== */
  /* Auth */
  /* ==== */
  async validateChannelAndMember(user: User, channelId: number): Promise<Channel> {
    const channel = await this.getChannelById(channelId);
    if (!channel) {
      throw new NotFoundException('Channel not found.');
    }

    const isMember = await this.isUserMember(user, channel);
    if (!isMember) {
      throw new NotAuthorizedException('User is not a member of the channel.');
    }

    return channel;
  }

  async isUserMember(user: User, channel: Channel): Promise<boolean> {
    const channelUser = await this.channelUserRepository.findOne({
      where: { user: { id: user.id }, channel: { id: channel.id } },
    });
    return !!channelUser;
  }

  async getChannelById(channelId: number): Promise<Channel | undefined> {
    return this.channelRepository.findOne({
      where: { id: channelId },
    });
  }
  
  /* ======= */
  /* Channel */
  /* ======= */
  async createChannel(
    creator: User,
    createChannelDto: CreateChannelDto,
  ): Promise<Channel> {
    const groupChannel: Channel = new Channel();
    groupChannel.title = createChannelDto.title;
    groupChannel.mode = createChannelDto.mode;
    if (createChannelDto.mode === ChannelMode.PROTECTED) {
      if (!createChannelDto.password) {
        throw new MissingPasswordException();
      }
      groupChannel.password = createChannelDto.password;
    }
    const savedGroupChannel = await this.channelRepository.save(groupChannel);

    const groupChannelUser: ChannelUser = new ChannelUser();
    groupChannelUser.user = creator;
    groupChannelUser.channel = savedGroupChannel;
    groupChannelUser.role = ChannelRole.OWNER;


    await this.channelUserRepository.save(groupChannelUser);
    return savedGroupChannel;
  }
  
  async enterGroupChannel(
    user: User,
    channelId: number,
    password: string,
  ): Promise<Channel> {
    const channel = await this.channelRepository.findOne({
      where: { id: channelId },
    });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const existingUser = await this.channelUserRepository.findOne({
      where: { user: { id: user.id }, channel: { id: channel.id } },
    });
    if (existingUser) {
      return channel;
    }

    if (channel.mode === ChannelMode.PROTECTED) {
      if (channel.password !== password) {
        throw new NotAuthorizedException('Invalid password');
      }
    }

    await this.joinChannel(user, channel);

    return channel;
  }

  async joinChannel(user: User, channel: Channel): Promise<ChannelUser> {
    const channelUser = new ChannelUser();
    channelUser.user = user;
    channelUser.channel = channel;
    channelUser.role = ChannelRole.NORMAL;
    channelUser.is_muted = false;
    channelUser.is_banned = false;
    return await this.channelUserRepository.save(channelUser);
  }

  async exitChannel(user: User, channelId: number): Promise<void> {
    const channel = await this.channelRepository.findOne({
      where: { id: channelId },
      relations: ['users', 'groupChannelUser'],
    });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const groupChannelUserToDelete = channel.groupChannelUser.find(
      (groupChannelUser) =>
        groupChannelUser.user.id === user.id &&
        groupChannelUser.channel.id === channel.id,
    );
    if (groupChannelUserToDelete) {
      await this.channelUserRepository.delete(groupChannelUserToDelete.id);
    }

    if (channel.groupChannelUser.length === 0) {
      await this.channelRepository.remove(channel);
    }
  }

  async getAllChannels(): Promise<Channel[]> {
    return this.channelRepository.find({
      where: { mode: Not(ChannelMode.PRIVATE) },
    });
  }

  async getMyChannels(user: User): Promise<Channel[]> {
    const groupChannelUser = await this.channelUserRepository.find({
      where: { user: { id: user.id } },
      relations: ['channel'],
    });

    return groupChannelUser.map((groupChannelUser) => groupChannelUser.channel);
  }

  async getChannelMembers(channelId: number): Promise<User[]> {
    const channelUsers = await this.channelUserRepository.find({
      where: { channel: { id: channelId } },
      relations: ['user'],
    });

    if (!channelUsers || channelUsers.length === 0) {
      throw new NotFoundException('No users found for the channel');
    }

    const users = channelUsers.map(channelUser => channelUser.user);
    return users;
  }

  async getUser(uid: number): Promise<User> {
    return await this.userRepository.findOne({ where: { uid } });
  }
  

  /* ==== */
  /* Chat */
  /* ==== */

  async createMessage(user: User, channelId: number, content: string): Promise<Cm> {
    const channel = await this.validateChannelAndMember(user, channelId);

    // 메시지 생성
    const message = new Cm();
    message.user = user;
    message.channel = channel;
    message.content = content;
    message.timeStamp = new Date();
    return await this.cmRepository.save(message);
  }

  // async getChatMessages(channelId: number): Promise<Cm[]> {
  //   const channel = await this.channelRepository.findOne({
  //     where: { id: channelId },
  //     relations: ['chatMessage'],
  //   });
  //   if (!channel) {
  //     throw new NotFoundException('Channel not found');
  //   }
  //   return channel.chatMessage;
  // }
}
