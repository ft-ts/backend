import { Module } from '@nestjs/common';
import { DmService } from './dm.service';
import { DmGateway } from './dm.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DM } from './entities/dm.entity';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DM, User,
    ]),
  ],
  providers: [DmGateway, DmService]
})
export class DmModule {}
