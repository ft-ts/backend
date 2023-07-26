import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { FTStrategy, RtStrategy } from './strategies';
import { AuthRepository } from './auth.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from './strategies/jwt.strategy';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AtGuard } from './auth.guard';
import { jwtConfig } from 'src/config/ft-ts.config';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register(jwtConfig),
    TypeOrmModule.forFeature([User]),
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
