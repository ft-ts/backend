// channel-user.guard.ts

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ChannelService } from '../channel.service';
import { NotFoundException } from 'src/common/exceptions/chat.exception';

@Injectable()
export class ChannelUserGuard implements CanActivate {
  constructor(private readonly channelService: ChannelService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const user = await this.channelService.getAuthenticatedUser(request.data.uid);
    console.log('user', user);
    const channelId = request.channelId;
    console.log('channelId', channelId);

    const channel = await this.channelService.getChannelById(channelId);
    if (!channel) {
      throw new NotFoundException('Channel not found.');
    }

    const isMember = await this.channelService.isUserMember(user, channel);
    if (!isMember) {
      throw new UnauthorizedException('User is not a member of the channel.');
    }

    return true;
  }
}
