import { Injectable } from '@nestjs/common';
import { Not, Repository } from 'typeorm';
import { CreateChannelDto } from './dto/create-channel.dto';
import * as bcrypt from 'bcrypt';
import { ChannelMode } from './enum/channelMode.enum';
import { ChannelRole } from './enum/channelRole.enum';
import { User } from 'src/user/entities/user.entity';
import { Channel } from './entities/channel.entity';
import { ChannelUser } from './entities';
import { InjectRepository } from '@nestjs/typeorm';
import { InvalidPasswordException, MissingPasswordException, NotAuthorizedException, NotFoundException } 
from 'src/common/exceptions/chat.exception';
import { Cm } from './entities/cm.entity';

@Injectable()
export class ChannelService {
  private readonly muteDuration = 3 * 60 * 1000; // 3 mins
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

  async getAuthenticatedUser(uid: number): Promise<User> {
    if (!uid) {
      throw new NotAuthorizedException('User not authenticated.');
    }
    const user = await this.getUserByUid(uid);
    return user;
  }

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
    const channel = await this.channelRepository.findOne({
      where: { id: channelId },
    });
    if (!channel) {
      throw new NotFoundException('Channel not found.');
    }
    return channel;
  }
  
  async getChannelUser(userId: number, channelId: number): Promise<ChannelUser | null> {
    const channelUser = await this.channelUserRepository.findOne({
      where: { user: { id: userId }, channel: { id: channelId } },
    });
    return channelUser;
  }

  async getUserByUid(uid: number): Promise<User> {
    return await this.userRepository.findOne({ where: { uid } });
  }

  async getUserById(id: number): Promise<User> {
    return await this.userRepository.findOne({ where: { id } });
  }

  async isMemberMuted(user: User, channelId: number): Promise<boolean> {
    const channelUser = await this.getChannelUser(user.id, channelId);
    return channelUser.is_muted;
  }

  async isMemberBanned(user: User, channelId: number): Promise<boolean> {
    const channelUser = await this.getChannelUser(user.id, channelId);
    if (!channelUser) {
      throw new NotFoundException('Channel user not found');
    }
    return channelUser.is_banned;
  }

  async getMemberCnt(channel: Channel): Promise<number> {
    const channelUsers = await this.channelUserRepository.find({
      where: { channel: { id: channel.id } },
    });
    return channelUsers.length;
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
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(createChannelDto.password, saltRounds);
      groupChannel.password = hashedPassword;
    }
    const savedChannel = await this.channelRepository.save(groupChannel);

    const channelUser: ChannelUser = new ChannelUser();
    channelUser.user = creator;
    channelUser.channel = savedChannel;
    channelUser.role = ChannelRole.OWNER;

    await this.channelUserRepository.save(channelUser);
    return savedChannel;
  }
  
  async enterChannel(
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
    const isFull = await this.getMemberCnt(channel) > 4;
    if (existingUser) {
      return channel;
    }
    else if (isFull) {
      throw new NotAuthorizedException('Channel is full');
    }
    else if (channel.mode === ChannelMode.PROTECTED) {
      if (channel.password !== password) {
        throw new InvalidPasswordException();
      }
    }
    else if (channel.mode === ChannelMode.PRIVATE) {
      throw new NotAuthorizedException('Channel is private');
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

  async leaveChannel(user: User, channelId: number): Promise<void> {
    const channel = await this.channelRepository.findOne({
      where: { id: channelId },
      relations: ['users', 'groupChannelUser'],
    });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const channelUserToDelete = channel.channelUser.find(
      (channelUser) =>
        channelUser.user.id === user.id &&
        channelUser.channel.id === channel.id,
    );
    if (channelUserToDelete) {
      if (channelUserToDelete.role === ChannelRole.OWNER) {
        this.changeOwner(channel.id);
      }
      await this.channelUserRepository.delete(channelUserToDelete.id);
    }

    if (channel.channelUser.length === 0) {
      await this.channelRepository.remove(channel);
    }
  }

  async getAllChannels(): Promise<Channel[]> {
    return this.channelRepository.find({
      where: { mode: Not(ChannelMode.PRIVATE) },
    });
  }

  async getMyChannels(user: User): Promise<Channel[]> {
    const channelUsers = await this.channelUserRepository.find({
      where: { user: { id: user.id } },
      relations: ['channel'],
    });
  
    const channels = channelUsers.map((channelUser) => channelUser.channel);
  
    return channels;
  }

  async editPassword(user: User, channelId: number, newPassword: string): Promise<Channel> {
    const channelOwner = await this.getChannelUser(user.id, channelId);
    if (channelOwner.role !== ChannelRole.OWNER) {
      throw new NotAuthorizedException('You are not the owner of the channel');
    }
    const channel = await this.getChannelById(channelId);
    if (channel.mode !== ChannelMode.PROTECTED) {
      throw new NotAuthorizedException('Password is no used in PROTECTED mode');
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    channel.password = hashedPassword;
    await this.channelRepository.save(channel);
    return channel;
  }

  async editMode(user: User, channelId: number, newMode: ChannelMode, password: string): Promise<Channel> {
    const channelOwner = await this.getChannelUser(user.id, channelId);
    if (channelOwner.role !== ChannelRole.OWNER) {
      throw new NotAuthorizedException('You are not the owner of the channel');
    }
    const channel = await this.getChannelById(channelId);
    channel.mode = newMode;
    if (newMode !== ChannelMode.PROTECTED) {
      channel.password = null;
    }
    else if (!password) {
        throw new MissingPasswordException();
    }
    else {
      channel.password = password;
    }
    await this.channelRepository.save(channel);
    return channel;
  }



  /* ====== */
  /* Member */
  /* ====== */

  async getChannelMembers(channelId: number): Promise<ChannelUser[]> {
    const channelUsers = await this.channelUserRepository.find({
      where: { channel: { id: channelId } },
    });

    if (!channelUsers || channelUsers.length === 0) {
      throw new NotFoundException('No users found for the channel');
    }

      // 역할 순서대로 정렬하는 비교 함수
    const roleOrder = {
      [ChannelRole.OWNER]: 1,
      [ChannelRole.ADMIN]: 2,
      [ChannelRole.NORMAL]: 3,
    };

    // 역할을 기준으로 정렬
    const sortedMembers = channelUsers.sort((a, b) => {
      return roleOrder[a.role] - roleOrder[b.role];
    });
    return sortedMembers;
  }

  async changeOwner(channelId: number): Promise<void> {
    const members = await this.getChannelMembers(channelId);
    if (members[1]) {
      members[1].role = ChannelRole.OWNER;
      await this.channelUserRepository.save(members[1]);
    }
  }
  
  async grantAdmin(user: User, channelId: number, targetId: number): Promise<void> {
    const channelOwner = await this.getChannelUser(user.id, channelId);
    if (channelOwner.role !== ChannelRole.OWNER) {
      throw new NotAuthorizedException('User is not the owner of the channel');
    }
    const targetChannelUser = await this.getChannelUser(targetId, channelId);
    if (targetChannelUser.role === ChannelRole.NORMAL) {
      targetChannelUser.role = ChannelRole.ADMIN;
      await this.channelUserRepository.save(targetChannelUser);
    }
    else {
      throw new NotAuthorizedException('User has already been granted admin');
    }
  }

  async revokeAdmin(user: User, channelId: number, targetId: number): Promise<void> {
    const channelOwner = await this.getChannelUser(user.id, channelId);
    if (channelOwner.role !== ChannelRole.OWNER) {
      throw new NotAuthorizedException('User is not the owner of the channel');
    }
    const targetChannelUser = await this.getChannelUser(targetId, channelId);
    if (targetChannelUser.role === ChannelRole.ADMIN) {
      targetChannelUser.role = ChannelRole.NORMAL;
      await this.channelUserRepository.save(targetChannelUser);
    }
    else {
      throw new NotAuthorizedException('User is not an admin');
    }
  }

  async muteMember(user: User, channelId: number, targetId: number): Promise<void> {
    const channelAdmin = await this.getChannelUser(user.id, channelId);
    if (channelAdmin.role === ChannelRole.NORMAL) {
      throw new NotAuthorizedException('User is not the admin of the channel');
    }
    const targetChannelUser = await this.getChannelUser(targetId, channelId);
    if (!targetChannelUser.is_muted) {
      targetChannelUser.is_muted = true;
      await this.channelUserRepository.save(targetChannelUser);
      setTimeout(() => {async () => {
        targetChannelUser.is_muted = false;
        await this.channelUserRepository.save(targetChannelUser);}
      }, this.muteDuration);
    }
    else {
      throw new NotAuthorizedException('User has already been muted');
    }
  }

  async banMember(user: User, channelId: number, targetId: number): Promise<void> {
    const channelAdmin = await this.getChannelUser(user.id, channelId);
    if (channelAdmin.role === ChannelRole.NORMAL) {
      throw new NotAuthorizedException('User is not the admin of the channel');
    }
  const targetChannelUser = await this.getChannelUser(targetId, channelId);
    if (!targetChannelUser.is_banned) {
      targetChannelUser.is_banned = true;
      await this.channelUserRepository.save(targetChannelUser);
    }
    else {
      throw new NotAuthorizedException('User has already been banned');
    }
  }

  async unbanMember(user: User, channelId: number, targetId: number): Promise<void> {
    const channelAdmin = await this.getChannelUser(user.id, channelId);
    if (channelAdmin.role === ChannelRole.NORMAL) {
      throw new NotAuthorizedException('User is not the admin of the channel');
    }
    const targetChannelUser = await this.getChannelUser(targetId, channelId);
    if (targetChannelUser.is_banned) {
      targetChannelUser.is_banned = false;
      await this.channelUserRepository.save(targetChannelUser);
    }
    else {
      throw new NotAuthorizedException('User is not banned');
    }
  }

  async kickMember(user: User, channelId: number, targetId: number): Promise<void> {
    const channelOwner = await this.getChannelUser(user.id, channelId);
    if (channelOwner.role === ChannelRole.NORMAL) {
      throw new NotAuthorizedException('User is not the owner of the channel');
    }
    const targetChannelUser = await this.getChannelUser(targetId, channelId);
    await this.channelUserRepository.delete(targetChannelUser.id);
  }

  async editTitle(user: User, channelId: number, newTitle: string): Promise<Channel> {
    const channelOwner = await this.getChannelUser(user.id, channelId);
    if (channelOwner.role !== ChannelRole.OWNER) {
      throw new NotAuthorizedException('You are not the owner of the channel');
    }
    const channel = await this.getChannelById(channelId);
    channel.title = newTitle;
    await this.channelRepository.save(channel);
    return channel;
  }

  async inviteUserToChannel(user: User, channelId: number, targetUser: User): Promise<void> {
    const isFull = await this.getMemberCnt(await this.getChannelById(channelId)) > 4;
    const targetChannelUser = await this.getChannelUser(targetUser.id, channelId);
    const channel = await this.getChannelById(channelId);
    if (channel.mode === ChannelMode.PRIVATE) {
      throw new NotAuthorizedException('Channel is private');
    }
    else if (isFull) {
      throw new NotAuthorizedException('Channel is full');
    }
    else if (!targetChannelUser) {
      await this.joinChannel(targetUser, await this.getChannelById(channelId));
    }
    else if (targetChannelUser.is_banned) {
      throw new NotAuthorizedException('User is banned from the channel');
    }
    else
    {
      throw new NotAuthorizedException('User is already a member of the channel');
    }
  }


  /* ==== */
  /* Chat */
  /* ==== */

  async createMessage(user: User, channelId: number, content: string): Promise<Cm> {
    const channel = await this.validateChannelAndMember(user, channelId);

    const message = new Cm();
    message.channelUser = await this.channelUserRepository.findOne({ where: { user: { id: user.id }, channel: { id: channel.id } } });
    
    if (await this.isMemberMuted(user, channelId)) {
      throw new NotAuthorizedException('User is muted');
    }
    message.content = content;
    message.timeStamp = new Date();
    await this.cmRepository.save(message)
    return message;
  }

  // async getChatMessages(channelId: number): Promise<Cm[]> {
  //   const channel = await this.channelRepository.findOne({
  //     where: { id: channelId },
  //     relations: ['message'],
  //   });
  //   if (!channel) {
  //     throw new NotFoundException('Channel not found');
  //   }
  //   return channel.chatMessage;
  // }
}
