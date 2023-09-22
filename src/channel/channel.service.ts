import { Injectable, Body } from '@nestjs/common';
import { MoreThan, Not, Repository } from 'typeorm';
import { CreateChannelDto } from './dto/create-channel.dto';
import * as bcrypt from 'bcrypt';
import { ChannelMode } from './enum/channelMode.enum';
import { ChannelRole } from './enum/channelRole.enum';
import { User } from 'src/user/entities/user.entity';
import { Channel } from './entities/channel.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { AlreadyPresentExeption, InvalidPasswordException, MissingPasswordException, NotAMemberException, NotAuthorizedException, NotFoundException } 
from 'src/common/exceptions/chat.exception';
import { Cm } from './entities/cm.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { ChannelUser } from './entities/channelUser.entity';
import { ChannelPasswordDto } from './dto/channel-password.dto';
import { Logger } from '@nestjs/common';

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

  async isChannelMember(user: User, channelId: number): Promise<boolean> {
    const channel = await this.getChannelById(channelId);
    if (!channel) {
      throw new NotFoundException('Channel not found.');
    }
    const isMember = await this.channelUserRepository.findOne({
      where: { user: { uid: user.uid }, channel: { id: channel.id } },
    });

    return !!isMember; // ????
  }

  /* null check */
  async getChannelById(channelId: number): Promise<Channel | null> {
    const channel = await this.channelRepository.findOne({
      where: { id: channelId },
    }).then((res) => {
      return res;
    }).catch((err) => {
      Logger.error(err);
      return null;
    });
    return channel;
  }

  /* null check */
  async getUserByUid(uid: number): Promise<User | null> {
    const user : User | null = await this.userRepository.findOne({
      where: { uid: uid },
    }).then((res) => {
      return res;
    }).catch((err) => {
      Logger.error(err);
      return null;
    });
    return user;
  }

  private async getMemberCnt(channel: Channel): Promise<number> {
    const channelUsers = await this.channelUserRepository.find({
      where: { channel: { id: channel.id } },
    });
    return channelUsers.length;
  }

  private async isBannedUser(user: User, channel: Channel): Promise<boolean> {
    if (!channel.banned_uid || channel.banned_uid.length === 0) {
      return false;
    }
    const isBanned = channel.banned_uid.includes(user.uid);
    return isBanned;
  }

  private async isMutedMember(user: User, channel: Channel): Promise<boolean> {
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
    creator_uid : number,
    createChannelDto: CreateChannelDto,
  ): Promise<Channel> {
    try{
      const creator: User | null = await this.getUserByUid(creator_uid);
      if (!creator) { throw new NotFoundException('User not found'); }
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
      const channelUser = await this.channelUserRepository.create({
          user: creator,
          channel: savedNewChannel,
          role: ChannelRole.OWNER
      });
      await this.channelUserRepository.save(channelUser);
      savedNewChannel.memberCnt = await this.getMemberCnt(savedNewChannel);
      await this.channelRepository.save(savedNewChannel);
      return savedNewChannel;
    } catch (err) {
      Logger.error(err);
      return err;
    }
  }

  private async setPassword(password: string): Promise<string> {
    const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      return hashedPassword;
  }
  
  async enterChannel(
    user: User,
    payload: { channelId: number; password: string}
  ): Promise<Channel | null> {
    const channel = await this.channelRepository.findOne({
      where: { id: payload.channelId },
    });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }
    if (await this.isBannedUser(user, channel)) {
      throw new NotAuthorizedException('You are banned from the channel');
    }
    const existingUser = await this.isChannelMember(user, payload.channelId);
    if (existingUser) {
      return channel;
    }
    const isFull = await this.getMemberCnt(channel) > 4;
     if (isFull) {
      throw new NotAuthorizedException('Channel is full');
    }
    else if (channel.mode === ChannelMode.PRIVATE) {
      throw new NotAuthorizedException('Channel is private');
    } else if (channel.mode === ChannelMode.PROTECTED) {
      
      if (payload.password === '') throw new MissingPasswordException();
      const isPasswordCorrect = await this.verifyPassword(payload);
      if (!isPasswordCorrect) throw new InvalidPasswordException();
    }
    await this.joinChannel(user, channel);
    return channel;
  }

  async verifyPassword(body: ChannelPasswordDto) {
    const { channelId, password } = body;
    const channel = await this.getChannelById(channelId);
    return await bcrypt.compare(password, channel.password);
  }

  async  joinChannel(user: User, channel: Channel): Promise<ChannelUser> {
    // is Exist? return 
    const channelUser = await this.channelUserRepository.create({
      user: user,
      channel: channel,
      role: ChannelRole.NORMAL,
      joined_at: new Date(),
    });
    await this.channelUserRepository.save(channelUser);
    channel.memberCnt = await this.getMemberCnt(channel);
    await this.channelRepository.save(channel);
    //emit message to channel memebers
    return channelUser;
  }

  async leaveChannel(user: User, channel: Channel): Promise<void> {
    const channelUserToDelete = await this.getChannelUser(user.uid, channel.id);
    if (channelUserToDelete) {
      if (channelUserToDelete.role === ChannelRole.OWNER) {
        await this.changeOwner(channel.id);
      }
      await this.channelUserRepository.remove(channelUserToDelete);
      await this.userRepository.save(user);
      channel.memberCnt = await this.getMemberCnt(channel);
      await this.channelRepository.save(channel);
      if (await this.getMemberCnt(channel) === 0) {
        await this.cmRepository.delete({ channel: { id: channel.id } });
        await this.channelRepository.remove(channel);
      }
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
      where: { user: { uid: user.uid } },
      relations: ['channel'],
      order: { id: 'DESC' },
    }).catch((err) => {
      console.log(err);
      return err;
    });
    const channels = channelUsers.map((channelUser) => channelUser.channel);
    return channels;
  }

  async updateChannel(
    user: User,
    payload: { channelId: number, title: string, password: string, mode: ChannelMode}
  ): Promise<Channel> {
    const owner = await this.getChannelUser(user.uid, payload.channelId);
    const channel = await this.getChannelById(payload.channelId);
    if (!owner || !channel) {
      throw new NotFoundException('Can Not Found');
    }else if (owner.role !== ChannelRole.OWNER) {
      throw new NotAuthorizedException('You are not the owner of the channel');
    }
    channel.title = payload.title;
    channel.mode = payload.mode;
    if (payload.mode === ChannelMode.PROTECTED) {
      if (!payload.password) {
        throw new MissingPasswordException();
      }
      channel.password = await this.setPassword(payload.password);
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
      relations: ['user'],
    });
    if (!channelUsers) {
      throw new NotFoundException('No users found for the channel');
    }
    const roleOrder = {
      [ChannelRole.OWNER]: 1,
      [ChannelRole.ADMIN]: 2,
      [ChannelRole.NORMAL]: 3,
    };
    const sortedMembers = channelUsers.sort((a, b) => {
      return roleOrder[a.role] - roleOrder[b.role];
    });
    return sortedMembers;
  }

  /* null check */
  private async getChannelUser(uid: number, channelId: number): Promise<ChannelUser | null> {
    const channelUser : ChannelUser | null = await this.channelUserRepository.findOne({
      where: { user: { uid: uid }, channel: { id: channelId } },
    }).then((res) => {
      return res;
    }).catch((err) => {
      Logger.error(err);
      return null;
    });
    return channelUser;
  }


  private async changeOwner(channelId: number): Promise<void> {
    const members = await this.getChannelMembers(channelId);
    if (members[1]) {
      members[1].role = ChannelRole.OWNER;
      await this.channelUserRepository.save(members[1]);
    }
  }
  
  async grantAdmin(user: User, payload: { channelId: number, targetUid: number}): Promise<void> {
    const channelOwner = await this.getChannelUser(user.uid, payload.channelId);
    const targetUser = await this.getChannelUser(payload.targetUid, payload.channelId);
    if (!channelOwner || !targetUser) {
      throw new NotFoundException('User not found');
    }
    if (channelOwner.role !== ChannelRole.OWNER) {
      throw new NotAuthorizedException('User is not the owner of the channel');
    }
    if (targetUser.role === ChannelRole.NORMAL) {
      targetUser.role = ChannelRole.ADMIN;
      await this.channelUserRepository.save(targetUser);
    } else {
      throw new NotAuthorizedException('User has already been granted admin');
    }
  }

  async revokeAdmin(user: User, payload: { channelId: number, targetUid: number}): Promise<void> {
    const channelOwner = await this.getChannelUser(user.uid, payload.channelId);
    const targetUser = await this.getChannelUser(payload.targetUid, payload.channelId);
    if (!channelOwner || !targetUser) {
      throw new NotFoundException('User not found');
    }
    if (channelOwner.role !== ChannelRole.OWNER) {
      throw new NotAuthorizedException('User is not the owner of the channel');
    }
    if (targetUser.role === ChannelRole.ADMIN) {
      targetUser.role = ChannelRole.NORMAL;
      await this.channelUserRepository.save(targetUser);
    } else {
      throw new NotAuthorizedException('User is not an admin');
    }
  }

  async muteMember(user: User, payload: { channelId: number, targetUid: number}): Promise<void> {
    const channelAdmin = await this.getChannelUser(user.uid, payload.channelId);
    const targetUSer = await this.getChannelUser(payload.targetUid, payload.channelId);
    if (!channelAdmin || !targetUSer) {
      throw new NotFoundException('User not found');
    }
    if (channelAdmin.role === ChannelRole.NORMAL) {
      throw new NotAuthorizedException('User is not the admin of the channel');
    }
    const channel = await this.getChannelById(payload.channelId);
    if (await this.isMutedMember(user, channel)) {
      throw new NotAuthorizedException('Member is already muted');
    } else {
      channel.muted_uid.push(payload.targetUid);
      await this.channelRepository.save(channel);
      setTimeout(async () => {
        channel.muted_uid = channel.muted_uid.filter((uid) => uid !== payload.targetUid);
        await this.channelRepository.save(channel);
      }, this.muteDuration);
    }
  }

  async banMember(user: User, payload: { channelId: number, targetUid: number}): Promise<void> {
    const channelAdmin = await this.getChannelUser(user.uid, payload.channelId);
    const targetUser = await this.getChannelUser(payload.targetUid, payload.channelId);
    if (!channelAdmin || !targetUser) {
      throw new NotFoundException('User not found');
    } else if (channelAdmin.role === ChannelRole.NORMAL) {
      throw new NotAuthorizedException('User is not the admin of the channel');
    }
    const channel = await this.getChannelById(payload.channelId);
    const isBannedTarget = await this.isBannedUser(targetUser.user, channel);
    if (!isBannedTarget) {
      await channel.banned_uid.push(targetUser.user.uid);
      const targetChannelUser = await this.getChannelUser(targetUser.user.uid, payload.channelId);
      await this.channelUserRepository.delete(targetChannelUser.id);
      await this.channelRepository.save(channel);
    }
    else {
      throw new AlreadyPresentExeption('User has already been banned');
    }
  }

  async unbanMember(user: User, payload: { channelId: number, targetUid: number}): Promise<void> {
    const channelAdmin = await this.getChannelUser(user.uid, payload.channelId);
    const targetUser = await this.getChannelUser(payload.targetUid, payload.channelId).catch((err) => {
      throw new NotFoundException('User not found');
    });
    if (channelAdmin.role === ChannelRole.NORMAL) {
      throw new NotAuthorizedException('User is not the admin of the channel');
    }
    const channel = await this.getChannelById(payload.channelId);
    const isBannedTarget = await this.isBannedUser(targetUser.user, channel);
    if (isBannedTarget) {
      channel.banned_uid = channel.banned_uid.filter((uid) => uid !== targetUser.user.uid);
      await this.channelRepository.save(channel);
    } else {
      throw new NotFoundException('User is not banned');
    }
  }

  async kickMember(user: User, payload : { channelId: number, targetUid: number}): Promise<void> {
    const channelOwner = await this.getChannelUser(user.uid, payload.channelId);
    const targetUser = await this.getChannelUser(payload.targetUid, payload.channelId).catch((err) => {
      throw new NotFoundException('User not found');
    });
    if (channelOwner.role === ChannelRole.NORMAL) {
      throw new NotAuthorizedException('User is not the owner of the channel');
    }
    const targetChannelUser = await this.getChannelUser(targetUser.user.uid, payload.channelId);
    await this.channelUserRepository.delete(targetChannelUser.id);
  }

  async inviteMember(user: User, payload : { channelId: number, targetUid: number}): Promise<void> {
    const channel : Channel | null = await this.getChannelById(payload.channelId);
    if (!channel){
      throw new NotFoundException('Channel not found');
    }
    const isFull : boolean = await this.getMemberCnt(channel) > 4;
    const targetUser : ChannelUser | null = await this.getChannelUser(payload.targetUid, payload.channelId);
    if (isFull) {
      throw new NotAuthorizedException('Channel is full');
    } else if (targetUser) {
      throw new NotAuthorizedException('User is already a member of the channel');
    } else if (await this.isBannedUser(targetUser.user, channel)) {
      throw new NotAuthorizedException('User is banned from the channel');
    }else{
      await this.joinChannel(targetUser.user, await this.getChannelById(channel.id));
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
    const msg = createMessageDto.content;
    const message = this.cmRepository.create({
      channel: channel,
      isNotice: false,
      sender_uid: user.uid,
      content: msg,
      timeStamp: new Date().toISOString()
      // replace(/T/, ' ').      // replace T with a space
      // replace(/\..+/, '')    // delete the dot and everything after,
    });
    await this.cmRepository.save(message)
    return message;
  }


  async getChannelMessages(user: User, channelId: number): Promise<Cm[]> {
    const channel = await this.validateChannelAndMember(user, channelId);
    const channelUser = await this.channelUserRepository.findOne({
      where: { user: { uid: user.uid }, channel: { id: channel.id } },
    });
    const messages = await this.cmRepository.find({
      where: {
        channel: { id: channel.id },
        timeStamp: MoreThan(channelUser?.joined_at), // joined_at 이후의 메시지만 가져옴
      },
      order: { timeStamp: 'ASC' },
    }).catch((err) => {
      Logger.error(err);
      return err;
    });
    
    return messages;
  }

  async sendNotification(createMessageDto: CreateMessageDto): Promise<Cm | undefined> {
    const channel = await this.getChannelById(createMessageDto.channelId);
    const message = this.cmRepository.create({
      channel: channel,
      isNotice: true,
      sender_uid: null,
      content: createMessageDto.content,
      timeStamp: new Date().toISOString().
      replace(/T/, ' ').      // replace T with a space
      replace(/\..+/, '')    // delete the dot and everything after,
    });
    await this.cmRepository.save(message)
    return message;
  }

  async getUserRole(user: User, channelId: number): Promise<ChannelRole> {
    const channel = await this.validateChannelAndMember(user, channelId);
    const channelUser = await this.channelUserRepository.findOne({
      where: { user: { uid: user.uid }, channel: { id: channel.id } },
    });
    return channelUser.role;
  }
}
