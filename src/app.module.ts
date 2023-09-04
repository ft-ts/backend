import { Module } from '@nestjs/common';
import { PongModule } from './pong/pong.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/auth.config';
import { UserModule } from './user/user.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoginModule } from './login/login.module';
import { LoggingInterceptor } from './common/interceptor/logging.interceptor';
import { AuthModule } from './auth/auth.module';
import { DmModule } from './dm/dm.module';
import { ChannelModule } from './channel/channel.module';
import { AppGateway } from './app.gateway';
import { AppController } from './app.controller';
import { SocketService } from './common/service/socket.service';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    LoginModule,
    UserModule,
    ChannelModule,
    PongModule,
    AuthModule,
    DmModule,
  ],
  providers: [
    AppGateway,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    SocketService,
  ],
  controllers: [AppController],
})
export class AppModule {}
