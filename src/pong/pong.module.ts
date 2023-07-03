import { Module } from '@nestjs/common';
import { PongService } from './pong.service';
import { PongController } from './pong.controller';

@Module({
  controllers: [PongController],
  providers: [PongService]
})
export class PongModule {}
