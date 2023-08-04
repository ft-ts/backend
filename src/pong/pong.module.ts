import { Module } from '@nestjs/common';
import { PongService } from './pong.service';
import { PongController } from './pong.controller';
import { DmModule } from 'src/dm/dm.module';
import { PongGateway } from './pong.gateway';
import { GameModule } from './game/game.module';
import { AuthModule } from 'src/auth/auth.module';
import { PongRepository } from './pong.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchInfo } from './entities/matchInfo.entity';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      MatchInfo,
    ]),
    DmModule,
    GameModule,
    AuthModule,
  ],
  controllers: [PongController],
  providers: [PongGateway, PongService, PongRepository],
})
export class PongModule {}
