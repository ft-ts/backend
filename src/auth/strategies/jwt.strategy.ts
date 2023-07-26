import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt, VerifiedCallback } from 'passport-jwt';
import { JwtPayload } from 'src/login/interfaces/jwtPayload.interface';
import { User } from 'src/user/entities/user.entity';
import { UserStatus } from 'src/user/enums/userStatus.enum';
import { AuthRepository } from '../auth.repository';

const AT_SECRET = process.env.AT_SECRET;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly authRepository: AuthRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // 헤더에서 JWT를 가져옴
      ignoreExpiration: false, // 만료된 JWT의 경우 401 Unauthorized 에러를 발생시킴
      secretOrKey: AT_SECRET, // 비밀 키
    });
  }

  async validate(jwtPayload: any, done: VerifiedCallback) {
    const { id }: JwtPayload = jwtPayload;
    const users: User = await this.authRepository.findOneBy({ id });
    if (!users || users.status === UserStatus.OFFLINE)
      done(new UnauthorizedException('Invalid token'), false);
    return done(null, users);
  }
}
