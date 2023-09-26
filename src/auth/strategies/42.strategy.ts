import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-42';
import { VerifiedCallback } from 'passport-jwt';
import { AuthRepository } from '../auth.repository';

@Injectable()
export class FTStrategy extends PassportStrategy(Strategy, '42') {
  constructor(private readonly authRepository: AuthRepository) {
    super({
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: `http://${process.env.SERVER_IP}:${process.env.BACK_PORT}/api/login/redirect`,
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
    const { id, login, email, image } = JSON.parse(profile._raw);
    // console.log('🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥');
    // console.log('🔥 profile', JSON.stringify(profile, null, 2));
    // console.log('🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥');
    // console.log('🔥 profile_raw', JSON.parse(profile._raw));

    done(null, {
      uid: id,
      name: login,
      email,
      avatar: image?.versions?.medium,
    });
  }
}
