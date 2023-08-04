import {
  Injectable, Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Socket } from 'socket.io';
import { User } from 'src/user/entities/user.entity';
import { UserStatus } from 'src/user/enums/userStatus.enum';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
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

  async validateSocket(client: Socket): Promise<boolean> {
    const token = client.handshake.headers.authorization;
    if (token === undefined || token === null) {
      Logger.error(`[AuthService validateSocket] invalid user`);
      return false;
    }
    const payload = this.validateAccessToken(token);
    if (payload === null)
      return false;
    client.data = { email: payload.email, uid: payload.uid };
    return await this.handleUserStatus(payload);
  }

  async handleUserStatus(payload: any) {
    const user = await this.userRepository.findOneBy({ uid: payload.uid });
    if (user === undefined || user === null) {
      Logger.error(`[AuthService handleUserStatus] invalid user`);
      return false;
    }
    if (user.status === UserStatus.OFFLINE) {
      user.status = UserStatus.ONLINE;
      await this.userRepository.update(user.id, { status: user.status });
      Logger.warn(`[AuthService handleUserStatus] ${user.name}(${user.uid}) is now ${user.status}`);
    }
    return true;
  }
}
