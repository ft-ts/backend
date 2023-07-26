import {
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

  validateToken(jwtToken: any) {
    try {
      const payload: any = this.jwtService.verify(jwtToken);
      return payload;
    }
    catch (err) {
      try {
        Logger.warn(`# validateToken: try to access with refresh token`);
        const payload: any = this.jwtService.verify(jwtToken, { secret: process.env.RT_SECRET });
        return payload;
      }
      catch (err) {
        Logger.error(`# validateToken : ${err}`);
        throw new UnauthorizedException();;
      }
    }
  }

  validateRequest(request: Request): boolean {
    const token = request.headers.authorization;
    if (token === undefined || token === null) {
      Logger.error(`# validateRequest: invalid user`);
      return false;
    }
    const jwtString = token.split('Bearer ')[1];
    const payload = this.validateToken(jwtString);
    request.user = { email: payload.email, uid: payload.uid };
    return true;
  }

  validateSocket(client: Socket): boolean {
    const token = this.getToken(client);
    if (token === undefined || token === null) {
      Logger.error(`# validateSocket: invalid user`);
      return false;
    }
    const payload = this.validateToken(token);
    return true;
  }

  private getToken(client: Socket) {
    const { token } = client.handshake.auth;
    return token;
  }
}
