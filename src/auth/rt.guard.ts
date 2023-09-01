import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class RtGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    Logger.debug('# RtGuard canActivate');
  
    const token =
      context.getType() === 'http'
        ? context.switchToHttp().getRequest().headers.authorization.split('Bearer ')[1]
        : context.switchToWs().getClient().handshake.auth.token;
  
    const user = await this.authService.validateRefreshToken(token);
    
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
