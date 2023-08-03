import { Module } from '@nestjs/common';
import { PongService } from './pong.service';
import { PongController } from './pong.controller';
import { GameService } from './game/game.service';
import { DmModule } from 'src/dm/dm.module';

@Module({
  imports: [DmModule],
  controllers: [PongController],
  providers: [PongService, GameService],
})
export class PongModule {}
