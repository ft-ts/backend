import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';

@Injectable()
export class CheckBlocked implements CanActivate {
  constructor(private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const payload = context.switchToWs().getData();
    const isTargetExist = await this.userService.findOne(payload.targetUid);
    if (!isTargetExist) {
      Logger.debug(`# [CheckBlocked] target(${payload.targetUid}) is not exist`);
      return false;
    }
    const isBlocked = await this.userService.checkBlocked(client.data.uid, payload.targetUid);
    Logger.debug(`# [CheckBlocked] ${payload.targetUid} -> ${client.data.uid} blocked : ${isBlocked}`);
    return !isBlocked;
  }
}
