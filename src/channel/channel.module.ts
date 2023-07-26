import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { ChannelRepository } from './channel.repository';
import { User } from 'src/user/entities/user.entity';
import { ChannelGateway } from './channel.gateway';
import { Channel } from './entities/channel.entity';
import { Cm } from './entities/cm.entity';
import { ChannelService } from './channel.service';
import { ChannelUser } from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Channel,
      ChannelUser,
      Cm,
      User,
    ]),
    AuthModule,
  ],
  providers: [ChannelGateway, ChannelService],
})
export class ChannelModule {}