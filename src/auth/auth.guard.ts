import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class AtGuard implements CanActivate {
  constructor(private readonly authService: AuthService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() === 'http')
      Logger.debug(`[AtGuard] canActivate [http, ${context.getArgs()[0].method} ${context.getArgs()[0].url}]`);
    else if (context.getType() === 'ws')
      Logger.debug(`[AtGuard] canActivate [ws, ${context.switchToWs().getPattern()}]`);

    const token =
      context.getType() === 'http'
        ? context.switchToHttp().getRequest().headers?.authorization?.split('Bearer ')[1]
        : context.switchToWs().getClient().handshake?.auth.token;

    if (!token) {
      Logger.debug('[AtGuard] No token. redirected to /login');
      if (context.getType() === 'ws')
        context.switchToWs().getClient().emit('redirect', '/login');
      else
        context.switchToHttp().getResponse().status(200).json({ redirectUrl: '/login' });
      throw new UnauthorizedException('No token');
    }

    const userToken: UserToken = await this.authService.validateAccessToken(token);
    const userInfo: User = await this.authService.getUserInfo(userToken.uid);

    if (!userToken)
      throw new UnauthorizedException('Invalid token');

    // 유저 2fa 설정과 발급된 토큰 설정이 같은가?
    if (userInfo.twoFactorAuth !== userToken.twoFactorAuth) {

      // 유저의 2fa가 켜져있고, 2faFreeUrl에 해당하지 않는 url로 접근했을 때 리다이렉트
      if (userInfo.twoFactorAuth && _2faFreeUrl.indexOf(context.switchToHttp().getRequest().url) === -1) {
        Logger.debug('[AtGuard] 2fa not checked. redirected to "/login/2fa"');
        context.switchToHttp().getResponse().status(200).json({ redirectUrl: '/login/2fa' });
      }
    }

    if (context.getType() === 'http') {
      context.switchToHttp().getRequest().user = userToken;
    } else if (context.getType() === 'ws') {
      context.switchToWs().getClient().data = userToken;
    } else {
      throw new UnauthorizedException(`Invalid context type: ${context.getType()}`);
    }

    return true;
  }
}


const _2faFreeUrl = [
  '/api/login/2fa',
];

interface UserToken {
  uid: number,
  email: string,
  twoFactorAuth: boolean,
  iat: Date,
  exp: Date
}
