import { Module } from '@nestjs/common';
import { DmService } from './dm.service';
import { DmGateway } from './dm.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DM } from './entities/dm.entity';
import { User } from 'src/user/entities/user.entity';
import { AuthModule } from 'src/auth/auth.module';
import { DmController } from './dm.controller';
import { dmRepository } from './dm.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DM, User,
    ]),
    AuthModule,
  ],
  controllers: [DmController],
  providers: [DmGateway, DmService, dmRepository],
})
export class DmModule {}
