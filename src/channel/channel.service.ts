import { Injectable, Body } from '@nestjs/common';
import { Not, Repository } from 'typeorm';
import { CreateChannelDto } from './dto/create-channel.dto';
import * as bcrypt from 'bcrypt';
import { ChannelMode } from './enum/channelMode.enum';
import { ChannelRole } from './enum/channelRole.enum';
import { User } from 'src/user/entities/user.entity';
import { Channel } from './entities/channel.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { AlreadyPresentExeption, InvalidPasswordException, MissingPasswordException, NotAuthorizedException, NotFoundException } 
from 'src/common/exceptions/chat.exception';
import { Cm } from './entities/cm.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { ChannelUser } from './entities/channelUser.entity';
import { ChannelPasswordDto } from './dto/channel-password.dto';

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

    const isMember = await this.channelUserRepository.findOne({
      where: { user: { id: user.id }, channel: { id: channel.id } },
    });
    if (!isMember) {
      throw new NotAuthorizedException('User is not a member of the channel.');
    }

    return channel;
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

  async getMemberCnt(channel: Channel): Promise<number> {
    const channelUsers = await this.channelUserRepository.find({
      where: { channel: { id: channel.id } },
    });
    return channelUsers.length;
  }

  async isBannedUser(user: User, channel: Channel): Promise<boolean> {
    if (!channel.banned_uid || channel.banned_uid.length === 0) {
      return false;
    }
  
    const isBanned = channel.banned_uid.includes(user.uid);
    return isBanned;
  }

  async isMutedMember(user: User, channel: Channel): Promise<boolean> {
    if (!channel.muted_uid || channel.muted_uid.length === 0) {
      return false;
    }
    const isMuted = channel.muted_uid.includes(user.uid);
    return isMuted;
  }

  /* ======= */
  /* Channel */
  /* ======= */

  async createChannel(
    creator: User,
    createChannelDto: CreateChannelDto,
  ): Promise<Channel> {
    const newChannel = this.channelRepository.create({
      title: createChannelDto.title,
      mode: createChannelDto.mode,
      password: "",
    });
    if (createChannelDto.mode === ChannelMode.PROTECTED) {
      if (!createChannelDto.password) {
        throw new MissingPasswordException();
      }
      newChannel.password = await this.setPassword(createChannelDto.password);
    }
    newChannel.banned_uid = [];
    newChannel.muted_uid = [];
    const savedNewChannel = await this.channelRepository.save(newChannel);
    const channelUser = this.channelUserRepository.create({
        user: creator,
        channel: savedNewChannel,
        role: ChannelRole.OWNER
    });
    await this.channelUserRepository.save(channelUser);
    savedNewChannel.memberCnt = await this.getMemberCnt(savedNewChannel);
    console.log(savedNewChannel);
    await this.channelRepository.save(savedNewChannel);
    return savedNewChannel;
  }

  async setPassword(password: string): Promise<string> {
    const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      return hashedPassword;
  }
  
  async enterChannel(
    user: User,
    channelId: number,
    password?: string,
  ): Promise<Channel> {
    const channel = await this.channelRepository.findOne({
      where: { id: channelId },
    });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (await this.isBannedUser(user, channel)) {
      throw new NotAuthorizedException('You are banned from the channel');
    }
    const existingUser = await this.channelUserRepository.findOne({
      where: { user: { id: user.id }, channel: { id: channel.id } },
    });
    const isFull = await this.getMemberCnt(channel) > 4;
    if (isFull) {
      throw new NotAuthorizedException('Channel is full');
    }
    else if (channel.mode === ChannelMode.PRIVATE) {
      throw new NotAuthorizedException('Channel is private');
    } else if (!!!existingUser) {
      await this.joinChannel(user, channel);
    }
    return channel;
  }

  async verifyPassword(body: ChannelPasswordDto) {
    const { channelId, password } = body;
    const channel = await this.getChannelById(channelId);
    return await bcrypt.compare(password, channel.password);
  }

  async joinChannel(user: User, channel: Channel): Promise<ChannelUser> {
    const channelUser = await this.channelUserRepository.create({
      user: user,
      channel: channel,
      role: ChannelRole.NORMAL
    });
    await this.channelUserRepository.save(channelUser);
    channel.memberCnt = await this.getMemberCnt(channel);
    await this.channelRepository.save(channel);
    return channelUser;
  }

  async leaveChannel(user: User, channel: Channel): Promise<void> {
    const channelUserToDelete = await this.getChannelUser(user.id, channel.id);
    if (channelUserToDelete) {
      if (channelUserToDelete.role === ChannelRole.OWNER) {
        await this.changeOwner(channel.id);
      }
      await this.channelUserRepository.delete(channelUserToDelete.id);
    }
    channel.memberCnt = await this.getMemberCnt(channel);
    await this.channelRepository.save(channel);
    if (await this.getMemberCnt(channel) === 0) {
      await this.cmRepository.delete({ channel: { id: channel.id } });
      await this.channelRepository.remove(channel);
    }
  }

  async getAllChannels(): Promise<Channel[]> {
    return this.channelRepository.find({
      where: { mode: Not(ChannelMode.PRIVATE) },
      order: { id: 'DESC' },
    });
  }

  async getMyChannels(user: User): Promise<Channel[]> {
    const channelUsers = await this.channelUserRepository.find({
      where: { user: { id: user.id } },
      relations: ['channel'],
      order: { id: 'DESC' },
    });
    const channels = channelUsers.map((channelUser) => channelUser.channel);
    return channels;
  }

  async editTitle(user: User, channel: Channel, newTitle: string): Promise<Channel> {
    const channelOwner = await this.getChannelUser(user.id, channel.id);
    if (channelOwner.role !== ChannelRole.OWNER) {
      throw new NotAuthorizedException('You are not the owner of the channel');
    }
    channel.title = newTitle;
    await this.channelRepository.save(channel);
    return channel;
  }

  async editPassword(user: User, channel: Channel, newPassword: string): Promise<Channel> {
    const channelOwner = await this.getChannelUser(user.id, channel.id);
    if (channelOwner.role !== ChannelRole.OWNER) {
      throw new NotAuthorizedException('You are not the owner of the channel');
    }
    if (channel.mode !== ChannelMode.PROTECTED) {
      throw new NotAuthorizedException('Password is not used in PROTECTED mode');
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    channel.password = hashedPassword;
    await this.channelRepository.save(channel);
    return channel;
  }

  async editMode(user: User, channel: Channel, newMode: ChannelMode, password: string): Promise<Channel> {
    const channelOwner = await this.getChannelUser(user.id, channel.id);
    if (channelOwner.role !== ChannelRole.OWNER) {
      throw new NotAuthorizedException('You are not the owner of the channel');
    }
    if (newMode !== ChannelMode.PROTECTED) {
      channel.password = null;
    }
    else if (!password) {
      throw new MissingPasswordException();
    }
    else {
      channel.password = password;
    }
    channel.mode = newMode;
    await this.channelRepository.save(channel);
    return channel;
  }


  /* ====== */
  /* Member */
  /* ====== */

  async getChannelMembers(channelId: number): Promise<ChannelUser[]> {
    const channelUsers = await this.channelUserRepository.find({
      where: { channel: { id: channelId } },
      relations: ['user'],
    });
    if (!channelUsers) {
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

  async muteMember(user: User, channelId: number, targetUid: number): Promise<void> {
    const channelAdmin = await this.getChannelUser(user.id, channelId);
    if (channelAdmin.role === ChannelRole.NORMAL) {
      throw new NotAuthorizedException('User is not the admin of the channel');
    }
    const channel = await this.getChannelById(channelId);
    if (await this.isMutedMember(user, channel)) {
      throw new NotAuthorizedException('Member is already muted');
    }
    else {
      channel.muted_uid.push(targetUid);
      await this.channelRepository.save(channel);
      setTimeout(async () => {
        channel.muted_uid = channel.muted_uid.filter((uid) => uid !== targetUid);
        await this.channelRepository.save(channel);
      }, this.muteDuration);
    }
  }

  async banMember(user: User, channelId: number, targetUser: User): Promise<void> {
    const channelAdmin = await this.getChannelUser(user.id, channelId);
    if (channelAdmin.role === ChannelRole.NORMAL) {
      throw new NotAuthorizedException('User is not the admin of the channel');
    }
    const channel = await this.getChannelById(channelId);
    const isBannedTarget = await this.isBannedUser(targetUser, channel);
    if (!isBannedTarget) {
      await channel.banned_uid.push(targetUser.uid);
      const targetChannelUser = await this.getChannelUser(targetUser.id, channelId);
      await this.channelUserRepository.delete(targetChannelUser.id);
      await this.channelRepository.save(channel);
    }
    else {
      throw new AlreadyPresentExeption('User has already been banned');
    }
  }

  async unbanMember(user: User, channelId: number, targetUser: User): Promise<void> {
    const channelAdmin = await this.getChannelUser(user.id, channelId);
    if (channelAdmin.role === ChannelRole.NORMAL) {
      throw new NotAuthorizedException('User is not the admin of the channel');
    }
    const channel = await this.getChannelById(channelId);
  const isBannedTarget = await this.isBannedUser(targetUser, channel);
  if (isBannedTarget) {
    channel.banned_uid = channel.banned_uid.filter((uid) => uid !== targetUser.uid);
    await this.channelRepository.save(channel);
  } else {
      throw new NotFoundException('User is not banned');
    }
  }

  async kickMember(user: User, channelId: number, targetUser: User): Promise<void> {
    const channelOwner = await this.getChannelUser(user.id, channelId);
    if (channelOwner.role === ChannelRole.NORMAL) {
      throw new NotAuthorizedException('User is not the owner of the channel');
    }
    const targetChannelUser = await this.getChannelUser(targetUser.id, channelId);
    await this.channelUserRepository.delete(targetChannelUser.id);
  }

  async inviteUserToChannel(user: User, channel: Channel, targetUser: User): Promise<void> {
    const isFull = await this.getMemberCnt(await this.getChannelById(channel.id)) > 4;
    const targetChannelUser = await this.getChannelUser(targetUser.id, channel.id);
    if (channel.mode === ChannelMode.PRIVATE) {
      throw new NotAuthorizedException('Channel is private');
    }
    else if (isFull) {
      throw new NotAuthorizedException('Channel is full');
    }
    else if (!targetChannelUser) {
      await this.joinChannel(targetUser, await this.getChannelById(channel.id));
    }
    else if (await this.isBannedUser(targetUser, channel)) {
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

  async createMessage(user: User, createMessageDto: CreateMessageDto): Promise<Cm | undefined> {
    const channel = await this.validateChannelAndMember(user, createMessageDto.channelId);
    if (await this.isMutedMember(user, channel)) {
      throw new NotAuthorizedException('You are muted');
    }
    if (!createMessageDto.content) {
      throw new NotFoundException('Content is empty');
    }
    const message = this.cmRepository.create({
      channel: channel,
      sender_uid: user.uid,
      content: createMessageDto.content,
      timeStamp: new Date().toISOString().
      replace(/T/, ' ').      // replace T with a space
      replace(/\..+/, '')    // delete the dot and everything after,
    });
    await this.cmRepository.save(message)
    return message;
  }

  async getChannelMessages(channel: Channel): Promise<Cm[]> {
    const messages = await this.cmRepository.find({
      where: { channel: { id: channel.id} },
    });
    return messages;
  }
}
