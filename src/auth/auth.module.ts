import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { jwtConfig } from 'src/config/auth.config';
import { AuthRepository } from './auth.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { AtGuard } from './auth.guard';
import { FTStrategy } from './strategies/42.strategy';
import { Token } from './entities/token.entity';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register(jwtConfig),
    TypeOrmModule.forFeature([User, Token]),
  ],
  providers: [
    AuthService,
    AuthRepository,
    FTStrategy,
    AtGuard,
  ],
  exports: [AuthService, JwtModule, PassportModule, AtGuard],

})
export class AuthModule { }
