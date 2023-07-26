import { ConfigModule } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

let envFilePath = '.env.development';

if (process.env.ENVIRONMENT === 'PRODUCTION') {
  envFilePath = '.env.production';
} else if (process.env.ENVIRONMENT === 'TEST') {
  envFilePath = '.env.test';
}

ConfigModule.forRoot({ envFilePath });

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: ['dist/**/*.entity.js'],
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  autoLoadEntities: true,
};

export const jwtConfig = {
  secret: process.env.AT_SECRET,
  signOptions: {
    expiresIn: process.env.AT_EXPIRESIN,
  },
};
