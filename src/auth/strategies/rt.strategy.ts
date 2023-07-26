import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt, VerifiedCallback } from 'passport-jwt';
import { Request } from 'express';
import { User } from 'src/user/entities/user.entity';
import { UserStatus } from 'src/user/enums/userStatus.enum';
import { JwtPayload } from 'src/login/interfaces/jwtPayload.interface';
import { AuthRepository } from '../auth.repository';

@Injectable()
export class RtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly authRepository: AuthRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // 헤더에서 JWT를 가져옴
      secretOrKey: process.env.RT_SECRET, // 비밀 키
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload, done: VerifiedCallback) {
    const refreshToken = req
      ?.get('Authorization')
      ?.replace('Bearer', '')
      .trim();
    const { id }: JwtPayload = payload;
    const users: User = await this.authRepository.findOneBy({ id });
    if (!users || users.status === UserStatus.OFFLINE)
      done(new UnauthorizedException('Invalid token'), false);

    if (!refreshToken) throw new ForbiddenException('Refresh token malformed');
    return {
      ...payload,
      hashedRt: refreshToken,
    };
  }
}
