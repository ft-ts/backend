import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { PongRepository } from '../pong.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { MatchInfoEntity } from '../entities/matchInfo.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      MatchInfoEntity,
    ]),
  ],
  providers: [GameService, PongRepository],
  exports: [GameService],
})
export class GameModule {}