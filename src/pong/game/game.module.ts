import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { PongRepository } from '../pong.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { MatchInfo } from '../pong.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      MatchInfo,
    ]),
  ],
  providers: [GameService, PongRepository],
  exports: [GameService],
})
export class GameModule {}