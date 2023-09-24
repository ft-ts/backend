import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/auth/auth.module';
import { User } from 'src/user/entities/user.entity';
import { ChannelGateway } from './channel.gateway';
import { Channel } from './entities/channel.entity';
import { Cm } from './entities/cm.entity';
import { ChannelService } from './channel.service';
import { ChannelUser } from './entities/channelUser.entity';
import { ChannelController } from './channel.controller';
import { AtGuard } from 'src/auth/auth.guard';
import { SocketModule } from 'src/common/module/socket.module';
import { CheckBlocked } from 'src/common/guards/block.guard';
import { Block } from 'src/user/entities/block.entity';
import { UserModule } from 'src/user/user.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      Channel,
      ChannelUser,
      Cm,
      User,
      Block
    ]),
    AuthModule,
    SocketModule,
  ],
  providers: [ChannelGateway, ChannelService, AtGuard],
  controllers: [ChannelController]
})
export class ChannelModule {}