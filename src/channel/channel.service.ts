import { Injectable } from '@nestjs/common';
import { Not, Repository } from 'typeorm';
import { CreateGroupChannelDto } from './dto/create-channel.dto';
import { ChannelMode } from './enum/channelMode.enum';
import { ChannelRole } from './enum/channelRole.enum';
import { User } from 'src/user/entities/user.entity';
import { ChannelRepository } from './channel.repository';
import { Channel } from './entities/channel.entity';
import { ChannelUser } from './entities';
import { InjectRepository } from '@nestjs/typeorm';
import { MissingPasswordException, NotAuthorizedException, NotFoundException } from 'src/common/exceptions/chat.exception';

@Injectable()
export class ChannelService {
  constructor(
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
    @InjectRepository(ChannelUser)
    private channelUserRepository: Repository<ChannelUser>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}
  
  async createGroupChannel(
    creator: User,
    createGroupChannelDto: CreateGroupChannelDto,
  ): Promise<Channel> {
    const groupChannel: Channel = new Channel();
    groupChannel.title = createGroupChannelDto.title;
    groupChannel.mode = createGroupChannelDto.mode;
    if (createGroupChannelDto.mode === ChannelMode.PROTECTED) {
      if (!createGroupChannelDto.password) {
        throw new MissingPasswordException();
      }
      groupChannel.password = createGroupChannelDto.password;
    }
    groupChannel.users = [creator];
    await this.channelRepository.save(groupChannel);

    const groupChannelUser: ChannelUser = new ChannelUser();
    groupChannelUser.user = creator;
    groupChannelUser.channel = groupChannel;
    groupChannelUser.role = ChannelRole.OWNER;
    await this.channelUserRepository.save(groupChannelUser);

    return groupChannel;
  }

  async exitGroupChannel(user: User, channelId: number): Promise<void> {
    const channel = await this.channelRepository.findOne({
      where: { id: channelId },
      relations: ['users', 'groupChannelUser'],
    });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // 사용자를 채널에서 제거
    const groupChannelUserToDelete = channel.groupChannelUser.find(
      (groupChannelUser) =>
        groupChannelUser.user.id === user.id &&
        groupChannelUser.channel.id === channel.id,
    );
    if (groupChannelUserToDelete) {
      // Delete the ChannelUser entity based on its id
      await this.channelUserRepository.delete(groupChannelUserToDelete.id);
    }

    // 채널에 남은 사용자가 없으면 채널을 삭제
    if (channel.users.length === 0) {
      await this.channelRepository.remove(channel);
    }
  }

  async getAllGroupChannels(): Promise<Channel[]> {
    return this.channelRepository.find({
      where: { mode: Not(ChannelMode.PRIVATE) },
    });
  }

  async getMyGroupChannels(user: User): Promise<Channel[]> {
    const groupChannelUser = await this.channelUserRepository.find({
      where: { user: { id: user.id } },
      relations: ['channel'],
    });

    return groupChannelUser.map((groupChannelUser) => groupChannelUser.channel);
  }

  async getGroupChannelById(id: number): Promise<Channel> {
    const channel = await this.channelRepository.findOne({
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
  ): Promise<Channel> {
    const channel = await this.channelRepository.findOne({
      where: { id: channelId },
    });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Check if the user is already in the channel
    const existingUser = await this.channelUserRepository.findOne({
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
    const groupChannelUser = new ChannelUser();
    groupChannelUser.user = user;
    groupChannelUser.channel = channel;
    await this.channelUserRepository.save(groupChannelUser);

    // Return the updated channel
    return channel;
  }

  async getChannelMembers(channelId: number): Promise<User[]> {
    const channel = await this.channelRepository.findOne({
      where: { id: channelId },
      relations: ['users'],
    });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }
    return channel.users;
  }

  async getUser(client: any): Promise<User> {
    const { uid } = client.data;
    return await this.userRepository.findOneBy({ uid });
  }
}
