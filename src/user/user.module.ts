import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { FriendshipRepository } from './repositories/friendship.repository';
import { UserRepository } from './repositories/user.repository';
import { Friendship } from './entities/friendship.entity';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([User, Friendship]),
    JwtModule,
    AuthModule,
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository],
})
export class UserModule {}
