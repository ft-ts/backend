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
      callbackURL: `http://${process.env.SERVER_IP}:${process.env.BACK_PORT}/api/login/redirect`,
      scope: ['public', 'profile'],
    });
  }

  async validate(
    accessToken: string, // ? 왜 필요?
    refreshToken: string,
    profile: any,
    done: VerifiedCallback,
  ) {
    Logger.debug('# FTStrategy validate');
    const { id, login, email, image } = JSON.parse(profile._raw);
    // console.log('🔥 accessToken', accessToken);
    // console.log('🔥 refreshToken', refreshToken);
    // console.log('🔥 profile', JSON.parse(profile._raw).image.versions.medium);
    
    done(null, {
      uid: id,
      name: login,
      email,
      avatar: image?.versions?.medium,
    });
  }
}
