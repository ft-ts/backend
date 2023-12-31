import {
  Injectable, Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Socket } from 'socket.io';
import { User } from 'src/user/entities/user.entity';
import { UserStatus } from 'src/user/enums/userStatus.enum';
import { Repository } from 'typeorm';
import { Token, TokenStatus } from './entities/token.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Token)
    private tokenRepository: Repository<Token>,
  ) { }

  async getUserInfo (uid: number) {
    return await this.userRepository.findOneBy({ uid });
  }

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

  async validateSocket(client: Socket): Promise<boolean> {
    const token = client.handshake.auth.token;
    if (token === undefined || token === null) {
      Logger.error(`[AuthService validateSocket] invalid user`);
      return false;
    }
    const payload = this.validateAccessToken(token);
    if (payload === null)
      return false;
    client.data = { email: payload.email, uid: payload.uid };
    return await this.handleUserStatus(payload.uid, true);
  }

  async handleUserStatus(uid: number, toOnline: boolean) {
    const user = await this.userRepository.findOneBy({ uid });
    if (user === undefined || user === null) {
      Logger.error(`[AuthService handleUserStatus] invalid user`);
      return false;
    }
    if (user.status === UserStatus.OFFLINE && toOnline === true) {
      user.status = UserStatus.ONLINE;
      await this.userRepository.update(user.id, { status: user.status });

      Logger.warn(`[AuthService handleUserStatus] ${user.name}(${user.uid}) is now ${user.status}`);
    }
    else if (user.status === UserStatus.ONLINE && toOnline === false) {
      user.status = UserStatus.OFFLINE;
      await this.userRepository.update(user.id, { status: user.status });
      Logger.warn(`[AuthService handleUserStatus] ${user.name}(${user.uid}) is now ${user.status}`);
    }
    return true;
  }

  async isActiveToken(accessToken: string): Promise<boolean> {
    const res = await this.tokenRepository.findOneBy({ accessToken });
    if (res === undefined || res === null)
      return false;
    if (res.status === TokenStatus.ACTIVE)
      return true;
  }
}
