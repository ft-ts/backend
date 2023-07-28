import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { runChannelSocketClient } from './channel-socket-client';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: true,
  });

  const port = process.env.SERVER_PORT || 10000;
  await app.listen(port);

  Logger.log(`App running on port ${port}`);


  runChannelSocketClient();
  
}
bootstrap();
