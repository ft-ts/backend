import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { GroupChannels } from './entities/groupChannel.entity';
import { GroupChannelUser } from './entities/groupChannelUser.entity';
import { User } from '../users/entities/user.entity';
import { DmChannelUser } from './entities/dmChannelUser.entity';
import { CreateGroupChannelDto } from './dto/channel.dto';
import { ChannelMode } from './enum/channelMode.enum';
import { ChannelRole } from './enum/channelRole.enum';
import { DmChannels } from './entities/dmChannel.entity';
import {
  MissingPasswordException,
  NotFoundException,
  NotAuthorizedException,
} from './exceptions/chat.exception';

@Injectable()
export class GroupChannelService {
  constructor(
    @InjectRepository(GroupChannels)
    private groupChannelsRepository: Repository<GroupChannels>,
    @InjectRepository(GroupChannelUser)
    private groupChannelUserRepository: Repository<GroupChannelUser>,
  ) {}

  async createGroupChannel(
    createGroupChannelDto: CreateGroupChannelDto,
    creator: User,
  ): Promise<GroupChannels> {
    const groupChannel: GroupChannels = new GroupChannels();
    groupChannel.title = createGroupChannelDto.title;
    groupChannel.mode = createGroupChannelDto.mode;

    if (createGroupChannelDto.mode === ChannelMode.PROTECTED) {
      if (!createGroupChannelDto.password) {
        throw new MissingPasswordException();
      }
      groupChannel.password = createGroupChannelDto.password;
    }

    const savedChannel = await this.groupChannelsRepository.save(groupChannel);

    const groupChannelUser: GroupChannelUser = new GroupChannelUser();
    groupChannelUser.user = creator;
    groupChannelUser.channel = savedChannel;
    groupChannelUser.role = ChannelRole.OWNER;
    await this.groupChannelUserRepository.save(groupChannelUser);

    return savedChannel;
  }

  async getAllGroupChannels(): Promise<GroupChannels[]> {
    return this.groupChannelsRepository.find({
      where: { mode: Not(ChannelMode.PRIVATE) },
    });
  }

  async getMyGroupChannels(user: User): Promise<GroupChannels[]> {
    const groupChannelUser = await this.groupChannelUserRepository.find({
      where: { user: { id: user.id } },
      relations: ['channel'],
    });

    return groupChannelUser.map((groupChannelUser) => groupChannelUser.channel);
  }

  async getGroupChannelById(id: number): Promise<GroupChannels> {
    const channel = await this.groupChannelsRepository.findOne({
      where: { id: id },
    });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }
    return channel;
  }

  async enterGroupChannel(
    user: User,
    channelId: number,
    password: string,
  ): Promise<GroupChannels> {
    const channel = await this.groupChannelsRepository.findOne({
      where: { id: channelId },
    });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Check if the user is already in the channel
    const existingUser = await this.groupChannelUserRepository.findOne({
      where: { user: { id: user.id }, channel: { id: channel.id } },
    });
    if (existingUser) {
      return channel; // User is already in the channel, no need to take any action
    }

    // Check if the channel is protected
    if (channel.mode === ChannelMode.PROTECTED) {
      // Verify the password
      if (channel.password !== password) {
        throw new NotAuthorizedException('Invalid password');
      }
    }

    // Add the user to the channel
    const groupChannelUser = new GroupChannelUser();
    groupChannelUser.user = user;
    groupChannelUser.channel = channel;
    await this.groupChannelUserRepository.save(groupChannelUser);

    // Return the updated channel
    return channel;
  }

  async getChannelMembers(channelId: number): Promise<User[]> {
    const channel = await this.groupChannelsRepository.findOne({
      where: { id: channelId },
      relations: ['users'],
    });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }
    return channel.users;
  }
}

@Injectable()
export class DmChannelService {
  constructor(
    @InjectRepository(DmChannels)
    private dmChannelRepository: Repository<DmChannels>,
    @InjectRepository(DmChannelUser)
    private dmChannelUserRepository: Repository<DmChannelUser>,
  ) {}

  async createDmChannel(userA: User, userB: User): Promise<DmChannels> {
    const dmChannel: DmChannels = new DmChannels();
    dmChannel.userA = userA;
    dmChannel.userB = userB;

    const savedChannel = await this.dmChannelRepository.save(dmChannel);

    const dmChannelUser1: DmChannelUser = new DmChannelUser();
    dmChannelUser1.user = userA;
    dmChannelUser1.channel = savedChannel;
    await this.dmChannelUserRepository.save(dmChannelUser1);

    const dmChannelUser2: DmChannelUser = new DmChannelUser();
    dmChannelUser2.user = userB;
    dmChannelUser2.channel = savedChannel;
    await this.dmChannelUserRepository.save(dmChannelUser2);

    return savedChannel;
  }
}
