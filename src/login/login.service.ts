import { ForbiddenException, HttpException, HttpStatus, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/user/entities/user.entity';
import { UserStatus } from 'src/user/enums/userStatus.enum';
import { authenticator } from 'otplib';
import { LoginRepository } from './login.repository';
import * as QRCode from 'qrcode';

@Injectable()
export class LoginService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly loginRepository: LoginRepository,
  ) { }
  
  onModuleInit() {
    this.loginRepository.update({}, { status: UserStatus.OFFLINE });
    Logger.debug('[AuthService onModuleInit] All Users Status => OFFLINE');
  }

  async getTokens({ uid, email, twoFactorAuth }): Promise<Tokens> {
    Logger.debug('# AuthService getTokens');
    const tokens = await Promise.all([
      this.jwtService.signAsync({ uid, email, twoFactorAuth }),
      this.jwtService.signAsync(
        { uid, email },
        { secret: process.env.RT_SECRET, expiresIn: process.env.RT_EXPIRESIN },
      ),
    ]);
    return {
      accessToken: tokens[0],
      refreshToken: tokens[1],
    };
  }

  async validateUser(userInfo): Promise<{tokens: Tokens, redirectUrl: string}> {
    Logger.debug('# AuthService validateUser');

    try {
      const existUser: User = await this.loginRepository.findOneBy({
        uid: userInfo.uid,
      });

      if (existUser) {
        let redirectUrl = '/main';
        if (existUser.twoFactorAuth) {
          Logger.warn('# User Found! But Two Factor Auth is Enabled');
          redirectUrl = '/login/2fa';
        }
        const tokens: Tokens = await this.getTokens({ uid: existUser.uid, email: existUser.email, twoFactorAuth: false });
        await this.updateRefreshToken(existUser, tokens.refreshToken);
        return {tokens, redirectUrl};
      }

      // 새 유저
      Logger.warn('# User Not Found! Creating New User...');
      
      const newUser: User = this.loginRepository.create({
        uid: userInfo.uid,
        name: userInfo.name,
        email: userInfo.email,
        avatar: userInfo.avatar,
        qrSecret: authenticator.generateSecret(),
      });
      await this.loginRepository.save(newUser);
      const tokens: Tokens = await this.getTokens({ uid: newUser.uid, email: newUser.email, twoFactorAuth: false });
      await this.updateRefreshToken(newUser, tokens.refreshToken);
      return {tokens, redirectUrl: '/main'};

    } catch (error) {
      Logger.debug('# AuthService validateUser Error', error);
      throw new InternalServerErrorException('Something went wrong at validateUser :(');
    }
  }

  async updateRefreshToken(user: User, hashedRt: string): Promise<void> {
    Logger.debug('# AuthService updateRefreshToken');

    try {
      const _user = await this.loginRepository.findOneBy({
        id: user.id, // uid로 변경?
      });
      if (!_user) throw new ForbiddenException('Access Denied (User Not Found)');
      await this.loginRepository.update(user.id, { hashedRt });
    } catch (error) {
      Logger.debug('# AuthService updateRefreshToken Error');
      throw new InternalServerErrorException('Something went wrong at updateRefreshToken :(');
    }
  }

  // 작동하는지 확인 필요
  async logout(user: User): Promise<{ message: string }> {
    try {
      const _user: User = await this.loginRepository.findOneBy({
        id: user.id,
        hashedRt: user.hashedRt,
      });
      await this.loginRepository.update(_user.id, {
        hashedRt: null,
        status: UserStatus.OFFLINE,
      });
    } catch (error) {
      Logger.debug('# AuthService logout Error', error);
      throw new InternalServerErrorException('Something went wrong :(');
    }
    return { message: 'Logout Success' };
  }
  
  // 작동하는지 확인 필요
  async refreshTokens(user: User): Promise<Tokens> {
    Logger.debug('# AuthService refreshTokens');
    const _user = await this.loginRepository.findOneBy({
      uid: user.uid,
    });
    if (!_user) throw new ForbiddenException('Access Denied (User Not Found)');
    if (_user.hashedRt != _user.hashedRt)
      throw new ForbiddenException('Access Denied (Refresh Token Mismatch)');
    const tokens: Tokens = await this.getTokens(_user);
    await this.updateRefreshToken(_user, tokens.refreshToken);
    return tokens;
  }

  async generateData(otpURI): Promise<string> {
    return new Promise((resolve, reject) => {
      QRCode.toDataURL(otpURI, (err, imgData) => {
        if (err) reject(err);
        resolve(imgData);
      });
    });
  }

  async createQRCode(user: User): Promise<string> {
    Logger.debug('# AuthService createQRCode');
    try {
      // 유저의 QR Secret을 가져온다.
      const { qrSecret } = await this.loginRepository.findOneBy({ uid: user.uid });

      // OTP URI를 생성한다.
      const otpURI = authenticator.keyuri(user.uid.toString(), process.env.TFA_SECRET, qrSecret);

      // QR 이미지 생성
      return await this.generateData(otpURI);
    } catch (error) {
      Logger.error('# AuthService createQRCode Error', error);
      throw new InternalServerErrorException('Something went wrong at twoFactorAuth :(');
    }
  }

  async validate2FA(userInfo: User, code: string) {
    const user = await this.loginRepository.findOneBy({ uid: userInfo.uid });
    if (+code !== +authenticator.generate(user.qrSecret))
      return null;

    return this.getTokens({ uid: user.uid, email: user.email, twoFactorAuth: true });
  }

  /**
   * 🤮🤮🤮🤮🤮🤮🤮🤮🤮🤮🤮🤮🤮🤮🤮🤮🤮🤮🤮🤮🤮🤮🤮🤮🤮🤮🤮
   * 
   * For TEST !!!!!!!!
   * 
   * 🤮🤮🤮🤮🤮🤮🤮🤮🤮🤮🤮🤮🤮🤮🤮🤮🤮🤮🤮🤮🤮🤮🤮🤮🤮🤮🤮
   */
  async getDemoTokens(userInfo: User): Promise<Tokens> {
    const { uid, email, twoFactorAuth } = userInfo;
    const tokens = await Promise.all([
      this.jwtService.signAsync({ uid, email, twoFactorAuth }, { expiresIn: '12h' }),
      this.jwtService.signAsync(
        { uid, email },
        { secret: process.env.RT_SECRET, expiresIn: '30d' },
      ),
    ]);

    return {
      accessToken: tokens[0],
      refreshToken: tokens[1],
    };
  }

  async loginByDemoUser(userInfo: User): Promise<Tokens> {
    Logger.debug('# AuthService loginBy "🤮Demo" User');

    try {
      const existUser: User = await this.loginRepository.findOneBy({
        uid: userInfo.uid,
      });

      if (existUser) {
        const tokens: Tokens = await this.getTokens(existUser);
        await this.updateRefreshToken(existUser, tokens.refreshToken);

        return tokens;
      }
      Logger.warn('# User Not Found! Creating New "🤮Demo" User...');

      const newUser: User = this.loginRepository.create({
        uid: userInfo.uid,
        name: userInfo.name,
        email: userInfo.email,
        avatar: userInfo.avatar,
        qrSecret: authenticator.generateSecret(),
      });

      await this.loginRepository.save(newUser);
      const tokens: Tokens = await this.getTokens(newUser);
      await this.updateRefreshToken(newUser, tokens.refreshToken);

      return tokens;
    } catch (error) {
      Logger.debug('# AuthService loginBy "🤮Demo" User Error', error);
      throw new InternalServerErrorException('Something went wrong at validate "🤮Demo" User :(');
    }
  }
}
