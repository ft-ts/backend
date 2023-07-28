

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ChannelService } from '../channel.service';
import { NotFoundException } from 'src/common/exceptions/chat.exception';

@Injectable()
export class ChannelAuthGuard implements CanActivate {
  constructor(private readonly channelService: ChannelService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const channelId = +request.params.channelId; // Assuming channelId is a route parameter

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
