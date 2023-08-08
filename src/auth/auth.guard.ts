import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class AtGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    Logger.debug('[AtGuard] canActivate');

    const token =
      context.getType() === 'http'
        ? context.switchToHttp().getRequest().headers.authorization.split('Bearer ')[1]
        : context.switchToWs().getClient().handshake.headers.authorization;

    const user = await this.authService.validateAccessToken(token);

    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    if (context.getType() === 'http') {
      context.switchToHttp().getRequest().user = user;
    } else if (context.getType() === 'ws') {
      context.switchToWs().getClient().data = user;
    } else {
      throw new UnauthorizedException(`Invalid context type: ${context.getType()}`);
    }

    return true;
  }
}
