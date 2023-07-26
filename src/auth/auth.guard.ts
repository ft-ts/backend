import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class AtGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    Logger.log('# AtGuard canActivate');
    
    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest();
      return this.authService.validateRequest(request);
    } else if (context.getType() === 'ws') {
      const client = context.switchToWs().getClient();
      return this.authService.validateSocket(client);
    } else {
      throw new UnauthorizedException(`Invalid context type : ${context.getType()}`);
    }
  }
}
