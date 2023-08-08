import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';

@Injectable()
export class CheckBlocked implements CanActivate {
  constructor(private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const payload = context.switchToWs().getData();
    const isBlocked = await this.userService.checkBlocked(client.data.uid, payload.targetUid);
    Logger.debug(`# [CheckBlocked] ${payload.targetUid} -> ${client.data.uid} blocked : ${isBlocked}`);
    return !isBlocked;
  }
}
