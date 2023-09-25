import { Injectable } from '@nestjs/common';
import { MoreThan, Not, Repository } from 'typeorm';
import { CreateChannelDto } from './dto/create-channel.dto';
import * as bcrypt from 'bcrypt';
import { ChannelMode } from './enum/channelMode.enum';
import { ChannelRole } from './enum/channelRole.enum';
import { User } from 'src/user/entities/user.entity';
import { Channel } from './entities/channel.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { 
  AlreadyPresentExeption,
  InvalidPasswordException,
  MissingPasswordException,
  NotAuthorizedException,
  NotFoundException
} from 'src/common/exceptions/chat.exception';
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
    if (!channel) throw new NotFoundException('Channel not found.');
    const isMember = await this.channelUserRepository.findOne({
      where: { user: { uid: user.uid }, channel: { id: channel.id } },
    });
    return !!isMember; // ????
  }

  /* todo null check */
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
  
  async verifyPassword(body: ChannelPasswordDto) {
    const { channelId, password } = body;
    const channel = await this.getChannelById(channelId);
    return await bcrypt.compare(password, channel.password);
  }

  async joinChannel(userUid: number, payload: { channelId: number; password: string}) {
    const user = await this.getUserByUid(userUid);
    const channel = await this.getChannelById(payload.channelId);
    if (!user || !channel) throw new NotFoundException('User or Channel not found');
    const isMember = await this.isMember(user, channel);
    if (isMember) return isMember;
    const isFull = await this.getMemberCnt(channel) > 4;
    if (isFull) throw new NotAuthorizedException('Channel is full');
    const isBanned = await this.isBannedUser(user, channel);
    if (isBanned) throw new NotAuthorizedException('User is banned from the channel');
    if (channel.mode === ChannelMode.PROTECTED) {
      if (payload.password === '') throw new MissingPasswordException();
      const isPasswordCorrect = await this.verifyPassword(payload);
      if (!isPasswordCorrect) throw new InvalidPasswordException();
    }
    const channelUser = this.channelUserRepository.create({
      user: user,
      channel: channel,
      role: ChannelRole.NORMAL,
      joined_at: new Date(),
    });
    await this.channelUserRepository.save(channelUser);
    channel.memberCnt = await this.getMemberCnt(channel);
    await this.channelRepository.save(channel);
    const patialChannel: Partial<Channel> = {
      id: channel.id,
      title: channel.title,
      mode: channel.mode,
    };
    const res = {
      user: user,
      channel: patialChannel as Channel,
      role: ChannelRole.NORMAL,
      isMember: false,
    };
    return res;
  }

  private async isMember(user: User, channel: Channel) {
    const res = await this.channelUserRepository.findOne({
      where: { user: { uid: user.uid }, channel: { id: channel.id } },
      relations: ['channel'],
    });
    if (!res) return null;
    const patialChannel: Partial<Channel> = {
      id: channel.id,
      title: channel.title,
      mode: channel.mode,
    };
    const channelUser = {
      user: user,
      channel: patialChannel as Channel,
      role: res.role,
      isMember: true,
    };
    return channelUser;
  }

  async leaveChannel(userUid: number, channel: Channel) {
    const channelUserToDelete = await this.getChannelUser(userUid, channel.id);
    if (channelUserToDelete) {
      if (channelUserToDelete.role === ChannelRole.OWNER) {
        await this.changeOwner(channel.id);
      }
      await this.channelUserRepository.remove(channelUserToDelete);
      // await this.userRepository.save(user);
      channel.memberCnt = await this.getMemberCnt(channel);
      await this.channelRepository.save(channel);
      if (await this.getMemberCnt(channel) === 0) {
        await this.cmRepository.delete({ channel: { id: channel.id } });
        await this.channelRepository.remove(channel);
      }
    }
  }

  async getAllChannels(): Promise<Channel[]> {
    const res = this.channelRepository.find({
      where: { mode: Not(ChannelMode.PRIVATE) },
      order: { id: 'DESC' },
    }).catch((err) => {
      Logger.error(err);
      throw new NotFoundException('No channels found');
    });
    return res;
  }

  async getMyChannels(user: User): Promise<Channel[]> {
    const channelUsers = await this.channelUserRepository.find({
      where: { user: { uid: user.uid } },
      relations: ['channel'],
      order: { id: 'DESC' },
    }).catch((err) => {
      Logger.error(err);
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
    const channelUser: ChannelUser | null = await this.channelUserRepository.findOne({
      where: { user: { uid: uid }, channel: { id: channelId } },
      relations: ['user', 'channel'],
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

  // return exception
  async grantAdmin(user: User, payload: { channelId: number, targetUid: number}): Promise<void> {
    const channelOwner = await this.getChannelUser(user.uid, payload.channelId);
    const targetUser = await this.getChannelUser(payload.targetUid, payload.channelId);
    if (!channelOwner || !targetUser) throw new NotFoundException('User not found');
    if (channelOwner.role !== ChannelRole.OWNER) throw new NotAuthorizedException('User is not the owner of the channel');
    if (targetUser.role === ChannelRole.NORMAL) {
      targetUser.role = ChannelRole.ADMIN;
      await this.channelUserRepository.save(targetUser);
    } else {
      throw new NotAuthorizedException('User has already been granted admin');
    }
  }

  //return exception
  async revokeAdmin(user: User, payload: { channelId: number, targetUid: number}): Promise<void> {
    const channelOwner = await this.getChannelUser(user.uid, payload.channelId);
    const targetUser = await this.getChannelUser(payload.targetUid, payload.channelId);
    if (!channelOwner || !targetUser) throw new NotFoundException('User not found');
    if (channelOwner.role !== ChannelRole.OWNER) throw new NotAuthorizedException('User is not the owner of the channel');
    if (targetUser.role === ChannelRole.ADMIN) {
      targetUser.role = ChannelRole.NORMAL;
      await this.channelUserRepository.save(targetUser);
    } else {
      throw new NotAuthorizedException('User is not an admin');
    }
  }

  //return exception
  async muteMember(user: User, payload: { channelId: number, targetUid: number}): Promise<void> {
    const channelAdmin = await this.getChannelUser(user.uid, payload.channelId);
    const targetUser = await this.getChannelUser(payload.targetUid, payload.channelId);
    if (!channelAdmin || !targetUser) throw new NotFoundException('User not found');
    if (channelAdmin.role === ChannelRole.NORMAL) throw new NotAuthorizedException('User is not the admin of the channel');
    const channel = await this.getChannelById(payload.channelId);
    if (await this.isMutedMember(user, channel)) throw new NotAuthorizedException('Member is already muted');
    else {
      channel.muted_uid.push(payload.targetUid);
      await this.channelRepository.save(channel);
      setTimeout(async () => {
        channel.muted_uid = channel.muted_uid.filter((uid) => uid !== payload.targetUid);
        await this.channelRepository.save(channel);
      }, this.muteDuration);
    }
  }


  //todo banMember
  async banMember(user: User, payload: { channelId: number, targetUid: number}) {
    const res = await this.getChannelUser(user.uid, payload.channelId).then((res) => {
      if (res.role === ChannelRole.NORMAL) throw new NotAuthorizedException('User is not the admin of the channel');
      return res.user.name;
    }).catch((err) => {
      Logger.error(err);
      return err;
    });
    await this.getChannelUser(payload.targetUid, payload.channelId).then((res) => {
      return res;
    }).catch((err) => {
      Logger.error(err);
      return err;
    });
    const channel = await this.getChannelById(payload.channelId).catch((err) => {
      Logger.error(err);
      return err;
    });
    const targetUser = await this.getUserByUid(payload.targetUid).catch((err) => {
      Logger.error(err);
      return err;
    });
    const isBannedTarget = await this.isBannedUser(targetUser.user, channel).then((res) => {
      if (res === true) {
        throw new AlreadyPresentExeption('User has already been banned');
      }
    }).catch((err) => {
      Logger.error(err);
      return err;
    });
    await channel.banned_uid.push(payload.targetUid);
    const targetChannelUser = await this.getChannelUser(payload.targetUid, payload.channelId);
    await this.channelUserRepository.delete(targetChannelUser.id);
    channel.memberCnt = await this.getMemberCnt(channel);
    await this.channelRepository.save(channel);
    return res;
  }

  //todo unbanMember
  async unbanMember(user: User, payload: { channelId: number, targetUid: number}): Promise<void> {
    await this.getChannelUser(user.uid, payload.channelId).then((res) => {
      if (res.role === ChannelRole.NORMAL) {
        throw new NotAuthorizedException('User is not the admin of the channel');
      }
    }).catch((err) => {
      Logger.error(err);
      return err;
    });
    const targetChannelUser = await this.getChannelUser(payload.targetUid, payload.channelId).catch((err) => {
      throw new NotFoundException('User not found');
    });
    const channel = await this.getChannelById(payload.channelId);
    await this.isBannedUser(targetChannelUser.user, channel).then((res) => {
      if (!res) {
        throw new NotFoundException('User is not banned');
      }
    }).catch((err) => {
      Logger.error(err);
      return err;
    });
  }

  // todo kick member
  async kickMember(user: User, payload : { channelId: number, targetUid: number}) {
    const res = await this.getChannelUser(user.uid, payload.channelId).then((res) => {
      return res.user.name;
    }).catch((err) => {
      Logger.error(err);
      return null;
    });
    const targetChannelUser = await this.getChannelUser(payload.targetUid, payload.channelId).then((res) => {
      return res;}
    ).catch((err) => {
      Logger.error(err);
      return null;
    });
    const channel = await this.getChannelById(payload.channelId);
    await this.channelUserRepository.remove(targetChannelUser);
    channel.memberCnt = await this.getMemberCnt(channel);
    await this.channelRepository.save(channel);
    return res;
  }

  async inviteMember(payload: {channelId: number, targetUid: number}){
    const channel = await this.getChannelById(payload.channelId);
    const targetUser = await this.getUserByUid(payload.targetUid);
    if (!channel || !targetUser) throw new NotFoundException('User or channel not found');
    const isBanned = await this.isBannedUser(targetUser, channel);
    if (isBanned) throw new NotAuthorizedException('User is banned from the channel');
    const isMember = await this.isChannelMember(targetUser, payload.channelId);
    if (isMember) throw new NotAuthorizedException('User is already a member of the channel');
    const userNum = await this.getMemberCnt(channel);
    if (userNum > 5) throw new NotAuthorizedException('Channel is full');
    const channelUser = await this.channelUserRepository.create({
      user: targetUser,
      channel: channel,
      role: ChannelRole.NORMAL,
      joined_at: new Date(),
    });
    await this.channelUserRepository.save(channelUser);
    channel.memberCnt = await this.getMemberCnt(channel);
    await this.channelRepository.save(channel);
    return targetUser.name;
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
      isNotice: createMessageDto.isNotice,
      sender: user,
      content: msg,
      timeStamp: new Date().toISOString()
    });
    try {
      await this.cmRepository.save(message);
      return message;
    } catch (error) {
      throw new Error('Failed to save message: ' + error.message);
    }
  }

  async getChannelMessages(user: User, channelId: number): Promise<Cm[]> {
    const channel = await this.validateChannelAndMember(user, channelId);
    const channelUser = await this.channelUserRepository.findOne({
      where: { user: { uid: user.uid }, channel: { id: channel.id } },
    })
    const messages = await this.cmRepository.find({
      where: {
        channel: { id: channel.id },
        timeStamp: MoreThan(channelUser?.joined_at), // joined_at 이후의 메시지만 가져옴
      },
      order: { timeStamp: 'ASC' },
      relations: ['sender'],
    }).catch((err) => {
      Logger.error(err);
      return err;
    });
    return messages;
  }

  async getUserRole(user: User, channelId: number): Promise<ChannelRole> {
    const channel = await this.validateChannelAndMember(user, channelId);
    const channelUser = await this.channelUserRepository.findOne({
      where: { user: { uid: user.uid }, channel: { id: channel.id } },
    }).catch((err) => {
      Logger.error(err);
      throw new NotFoundException('User not found');
    });
    return channelUser.role;
  }
}
