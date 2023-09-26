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

  async validateUser(userInfo: Partial<User>): Promise<{ accessToken: string, redirectUrl: string }> {
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
        const accessToken = await this.jwtService.signAsync({ uid: existUser.uid, email: existUser.email, twoFactorAuth: false });
        return { accessToken, redirectUrl };
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

      const accessToken = await this.jwtService.signAsync({ uid: newUser.uid, email: newUser.email, twoFactorAuth: false });
      return { accessToken, redirectUrl: '/login/signup' };

    } catch (error) {
      Logger.debug('# AuthService validateUser Error', error);
      throw new InternalServerErrorException('Something went wrong at validateUser :(');
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

    return await this.jwtService.signAsync({ uid: user.uid, email: user.email, twoFactorAuth: true });
  }
}