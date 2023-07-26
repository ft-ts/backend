import { Module } from '@nestjs/common';
import { DmService } from './dm.service';
import { DmGateway } from './dm.gateway';
import { typeOrmConfig } from 'src/config/ft-ts.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dm, DmChannel, DmUser } from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DmChannel,
      DmUser,
      Dm,
    ]),
  ],
  providers: [DmGateway, DmService]
})
export class DmModule {}
