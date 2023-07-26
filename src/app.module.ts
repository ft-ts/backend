import { Module } from '@nestjs/common';
import { ChatModule } from './chat/chat.module';
import { PongModule } from './pong/pong.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { LoginModule } from './login/login.module';
import { LoggingInterceptor } from './common/interceptor/logging.interceptor';
import { AuthModule } from './auth/auth.module';
import { AppGateway } from './app.gateway';
import { UserModule } from './user/user.module';
import { typeOrmConfig } from './config/ft-ts.config';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    LoginModule,
    UserModule,
    ChatModule,
    PongModule,
    AuthModule,
  ],
  providers: [
    AppGateway,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
