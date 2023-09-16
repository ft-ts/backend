import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';

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

    console.log('❎❎❎❎❎❎❎❎❎❎❎❎❎❎❎❎❎❎❎❎❎❎❎❎❎');
    console.log(context.getType(), token);
    console.log('❎❎❎❎❎❎❎❎❎❎❎❎❎❎❎❎❎❎❎❎❎❎❎❎❎');

    if (!token) {
      Logger.debug('[AtGuard] No token. redirected to /login');
      if (context.getType() === 'ws')
        context.switchToWs().getClient().emit('redirect', '/login');
      else
        context.switchToHttp().getResponse().status(200).json({ redirectUrl: '/login' });
      throw new UnauthorizedException('No token');
    }

    const userToken = await this.authService.validateAccessToken(token);
    const userInfo = await this.authService.getUserInfo(userToken.uid);
    userToken._check_2fa = false;

    if (!userToken) {
      throw new UnauthorizedException('Invalid token');
    }

    // 유저 2fa 설정과 발급된 토큰 설정이 같은가?
    // 아니면 2fa 검사하도록 리다이렉트 해야함
    if (userInfo.twoFactorAuth !== userToken.twoFactorAuth) {
      userToken._check_2fa = true;
      // const response = context.switchToHttp().getResponse();
      // response.redirect('http://localhost:3000/login/2fa', 302);
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
