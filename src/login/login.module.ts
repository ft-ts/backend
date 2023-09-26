import { Module } from '@nestjs/common';
import { LoginService } from './login.service';
import { LoginController } from './login.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { LoginRepository } from './login.repository';
import { AuthModule } from 'src/auth/auth.module';
import { Token } from 'src/auth/entities/token.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Token]),
    AuthModule,
  ],
  controllers: [LoginController],
  providers: [
    LoginService,
    LoginRepository,
  ],
})
export class LoginModule {}
