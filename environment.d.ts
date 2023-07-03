declare namespace NodeJS {
  export interface ProcessEnv {
    SERVER_PORT: string;
    DB_TYPE: string;
    DB_HOST: string;
    DB_PORT: string;
    DB_USERNAME: string;
    DB_PASSWORD: string;
    DB_DATABASE: string;
    DB_SYNCHRONIZE: string;
    ENVIRONMENT: Environment;
  }

  export type Environment = 'DEVELOPMENT' | 'PRODUCTION' | 'TEST';
}
