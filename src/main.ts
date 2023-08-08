import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: '*',
  });

  const port = process.env.SERVER_PORT || 10000;
  await app.listen(port);

  Logger.debug(`App running on port ${port}`);
}
bootstrap();
