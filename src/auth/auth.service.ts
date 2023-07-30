import {
  ForbiddenException,
  Injectable, Logger, UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Socket } from 'socket.io';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
  ) { }

  validateAccessToken(jwtToken: any) {
    try {
      const payload: any = this.jwtService.verify(jwtToken);
      return payload;
    }
    catch (err) {
      Logger.error(`# validateToken: invalid token`, err);
      return null;
    }
  }

  validateRefreshToken(jwtToken: any) {
    try {
      const payload: any = this.jwtService.verify(jwtToken, { secret: process.env.RT_SECRET });
      return payload;
    }
    catch (err) {
      Logger.error(`# validateRefreshToken: invalid token`, err);
      return null;
    }
  }

  validateSocket(client: Socket): boolean {
    const token = client.handshake.headers.authorization;
    if (token === undefined || token === null) {
      Logger.error(`# validateSocket: invalid user`);
      return false;
    }
    const payload = this.validateAccessToken(token);
    if (payload === null)
      return false;
    client.data = { email: payload.email, uid: payload.uid };
    return true;
  }

}
