import { Controller, Get, Param } from '@nestjs/common';

@Controller('channels')
export class ChannelController {
  @Get(':channelId')
  getChannel(@Param('channelId') channelId: number) {
    return `Channel with ID ${channelId}`;
  }
}
