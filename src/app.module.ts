import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { PongModule } from './pong/pong.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './users/user.module';
import { typeOrmConfig } from './config/ft-ts.config';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    AuthModule,
    ChatModule,
    UserModule,
    PongModule,
  ],
})
export class AppModule {}
