import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-42';
import { VerifiedCallback } from 'passport-jwt';

@Injectable()
export class FTStrategy extends PassportStrategy(Strategy, '42') {
  constructor() {
    super({
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL}:${process.env.BACK_PORT}/login/redirect`,
      scope: ['public', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifiedCallback,
  ) {
    Logger.debug('# FTStrategy validate');
    const { id, login, email, image } = profile._json;
    done(null, {
      uid: id,
      name: login,
      email,
      avatar: image.link,
    });
  }
}
