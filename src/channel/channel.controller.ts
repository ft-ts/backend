import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { ChannelService } from './channel.service';
import { AuthGuard } from '@nestjs/passport'; // 예시로 AuthGuard 사용

@Controller('channel')
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  @UseGuards(AuthGuard('jwt')) // 예시로 JWT 인증 사용
  @Get('/enter:channelId')
  async enterChannel(@Body() payload: any) {
    const { uid, channelId, password } = payload;
    const user = await this.channelService.getAuthenticatedUser(uid);
    const channel = await this.channelService.enterChannel(user, channelId, password);
	return { channel };
  }

  @UseGuards(AuthGuard('jwt')) // 예시로 JWT 인증 사용
  @Get('/:channelId')
  async getChannelById(@Body() payload: any) {
	const { channelId } = payload;
	const channel = await this.channelService.getChannelById(channelId);
	return { channel };
  }
}
