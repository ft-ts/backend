import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { DmChannel, DmUser } from './entities';

@Injectable()
export class DmService {
  constructor(
    @InjectRepository(DmChannel)
    private dmRepository: Repository<DmChannel>,
    @InjectRepository(DmUser)
    private dmUserRepository: Repository<DmUser>,
  ) {}

  async createDmChannel(userA: User, userB: User): Promise<DmChannel> {
    const dmChannel: DmChannel = new DmChannel();
    dmChannel.userA = userA;
    dmChannel.userB = userB;

    const savedGroupChannel = await this.dmRepository.save(dmChannel);

    const dmChannelUser1: DmUser = new DmUser();
    dmChannelUser1.user = userA;
    dmChannelUser1.channel = savedGroupChannel;
    await this.dmUserRepository.save(dmChannelUser1);

    const dmChannelUser2: DmUser = new DmUser();
    dmChannelUser2.user = userB;
    dmChannelUser2.channel = savedGroupChannel;
    await this.dmUserRepository.save(dmChannelUser2);

    return savedGroupChannel;
  }
}
