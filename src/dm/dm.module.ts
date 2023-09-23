import { MiddlewareConsumer, Module } from '@nestjs/common';
import { DmService } from './dm.service';
import { DmGateway } from './dm.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DM } from './entities/dm.entity';
import { User } from 'src/user/entities/user.entity';
import { AuthModule } from 'src/auth/auth.module';
import { DmController } from './dm.controller';
import { dmRepository } from './dm.repository';
import { UserModule } from 'src/user/user.module';
import { Block } from 'src/user/entities/block.entity';
import { CheckBlocked } from 'src/common/guards/block.guard';
import { AtGuard } from 'src/auth/auth.guard';
import { SocketModule } from 'src/common/module/socket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DM, User, Block
    ]),
    AuthModule,
    UserModule,
    SocketModule,
  ],
  controllers: [DmController],
  providers: [DmGateway, DmService, dmRepository, CheckBlocked, AtGuard],
})
export class DmModule {}
