import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { User } from 'src/user/entities/user.entity';
import { ChannelGateway } from './channel.gateway';
import { Channel } from './entities/channel.entity';
import { Cm } from './entities/cm.entity';
import { ChannelService } from './channel.service';
import { ChannelUserGuard } from './guards/channel-user.guard';
import { ChannelUser } from './entities/channelUser.entity';
import { ChannelController } from './channel.controller';

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
  providers: [ChannelGateway, ChannelService, ChannelUserGuard],
  controllers: [ChannelController]
})
export class ChannelModule {}