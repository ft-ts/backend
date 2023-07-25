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
  ) {}

  async getTokens(userInfo: User): Promise<Tokens> {
    const { uid, email } = userInfo;
    const tokens = await Promise.all([
      this.jwtService.signAsync({ uid, email }),
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

  async validateUser(userInfo): Promise<Tokens> {
    Logger.log('# AuthService validateUser');

    try {
      const existUser: User = await this.loginRepository.findOneBy({
        uid: userInfo.uid,
      });

      if (existUser) {
        const tokens: Tokens = await this.getTokens(existUser);
        await this.updateRefreshToken(existUser, tokens.refreshToken);

        return tokens;
      }

      Logger.warn('# User Not Found! Creating New User...');

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
      Logger.log('# AuthService validateUser Error', error);
      throw new InternalServerErrorException('Something went wrong at validateUser :(');
    }
  }

  async updateRefreshToken(user: User, hashedRt: string): Promise<void> {
    Logger.log('# AuthService updateRefreshToken');

    try {
      const _user = await this.loginRepository.findOneBy({
        id: user.id,
      });
      if (!_user) throw new ForbiddenException('Access Denied (User Not Found)');
      await this.loginRepository.update(user.id, { hashedRt });
    } catch (error) {
      Logger.log('# AuthService updateRefreshToken Error');
      throw new InternalServerErrorException('Something went wrong at updateRefreshToken :(');
    }
  }

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
      Logger.log('# AuthService logout Error', error);
      throw new InternalServerErrorException('Something went wrong :(');
    }
    return { message: 'Logout Success' };
  }

  async refreshTokens(user: User): Promise<Tokens> {
    Logger.log('# AuthService refreshTokens');
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

  generateData(otpURI): Promise<string> {
    return new Promise((resolve, reject) => {
      QRCode.toDataURL(otpURI, (err, data) => {
        if (err) {
          console.error(err);
          reject(err);
        }
        resolve(data);
      });
    });
  }

  async validateOtp(payload: any, code: string) {
    const user = await this.loginRepository.findOneBy({ id: payload.id });

    if (code !== authenticator.generate(user.qrSecret)) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    return { message: 'Success' };
  }



  // crypto-js 암호화 필요
  async createTwoFactorAuth(user: User): Promise<string> {
    Logger.log('# AuthService twoFactorAuth');
    let data: string;
    try {
      const secret = authenticator.generateSecret();
      const otpURI = authenticator.keyuri(user.name, process.env.TFA_SECRET, secret);
      data = await this.generateData(otpURI);
      if (!data)
        throw new Error('Something went wrong on 2fa data :(');
    } catch (error) {
      Logger.log('# AuthService twoFactorAuth Error', error);
      throw new InternalServerErrorException('Something went wrong at twoFactorAuth :(');
    }
    return data;
  }

  async verifyTwoFactorAuth(user: User, body: any) {
    const { code } = body;
    const secret = process.env.TFA_SECRET;
    const token = authenticator.generate(secret);
    console.log(`==================`);
    console.log(token);
    console.log(authenticator.generate(secret));
    console.log(authenticator.generate(code));
    console.log(`==================`);
    const isValid = authenticator.verify({ token: code, secret });
    console.log(isValid);
    return { message: isValid };
  }

}
