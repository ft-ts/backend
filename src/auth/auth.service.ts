import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthRepository } from './auth.repository';
import { User } from 'src/user/entities/user.entity';
import { UserStatus } from 'src/user/enums/userStatus.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  async getTokens(intraId: number, email: string): Promise<Tokens> {
    const tokens = await Promise.all([
      this.jwtService.signAsync({ intraId, email }),
      this.jwtService.signAsync(
        { intraId, email },
        { secret: process.env.RT_SECRET, expiresIn: process.env.RT_EXPIRESIN },
      ),
    ]);
    return {
      accessToken: tokens[0],
      refreshToken: tokens[1],
    };
  }

  async validateUser(userDto): Promise<Tokens> {
    Logger.log('# AuthService validateUser');

    try {
      const existUser: User = await this.authRepository.findOneBy({
        id: userDto.id,
      });

      if (existUser) {
        const tokens: Tokens = await this.getTokens(
          existUser.intraId,
          existUser.email,
        );
        await this.updateRtHash(existUser, tokens.refreshToken);
        return tokens;
      }

      Logger.log('# User Not Found! Creating New User...');

      const newUser: User = this.authRepository.create({
        intraId: userDto.intraId,
        name: userDto.name,
        email: userDto.email,
        avatar: userDto.avatar,
      });
      this.authRepository.save(newUser);
      const tokens: Tokens = await this.getTokens(
        newUser.intraId,
        newUser.email,
      );
      await this.updateRtHash(newUser, tokens.refreshToken);
      return tokens;
    } catch (error) {
      Logger.log('# AuthService validateUser Error', error);
      throw new InternalServerErrorException('Something went wrong :(');
    }
  }

  async updateRtHash(user: User, hashedRt: string): Promise<void> {
    Logger.log('# AuthService updateRtHash');

    try {
      await this.authRepository.update(user.id, {
        hashedRt,
        status: UserStatus.ONLINE,
      });
    } catch (error) {
      Logger.log('# AuthService updateRtHash Error');
      throw new InternalServerErrorException('Something went wrong :(');
    }
  }

  async logout(user: User): Promise<{ message: string }> {
    try {
      const _user: User = await this.authRepository.findOneBy({
        id: user.id,
        hashedRt: user.hashedRt,
      });
      await this.authRepository.update(_user.id, {
        hashedRt: null,
        status: UserStatus.OFFLINE,
      });
    } catch (error) {
      Logger.log('# AuthService logout Error', error);
      throw new InternalServerErrorException('Something went wrong :(');
    }
    return { message: 'Logout Success' };
  }

  async refreshTokens(user: User): Promise<Tokens> {
    Logger.log('# AuthService refreshTokens');
    const _user = await this.authRepository.findOneBy({
      id: user.id,
    });
    if (!user) throw new ForbiddenException('Access Denied (User Not Found)');
    if (user.hashedRt != _user.hashedRt)
      throw new ForbiddenException('Access Denied (Refresh Token Mismatch)');
    const tokens: Tokens = await this.getTokens(_user.intraId, _user.email);
    await this.updateRtHash(_user, tokens.refreshToken);
    return tokens;
  }
}
