import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt, VerifiedCallback } from 'passport-jwt';
import { AuthRepository } from '../auth.repository';
import { JwtPayload } from '../interfaces/jwtPayload.interface';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authRepository: AuthRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // 헤더에서 JWT를 가져옴
      ignoreExpiration: false, // 만료된 JWT의 경우 401 Unauthorized 에러를 발생시킴
      secretOrKey: process.env.JWT_SECRET, // 비밀 키
    });
  }

  async validate(jwtPayload: any, done: VerifiedCallback) {
    const { intraId }: JwtPayload = jwtPayload;
    const users: User = await this.authRepository.findOneBy({ intraId });

    if (!users) done(new UnauthorizedException('Invalid token'), false);
    return done(null, users);
  }
}
