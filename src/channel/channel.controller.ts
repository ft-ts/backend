import { Controller,Post, Patch, Body, UseGuards, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ChannelService } from './channel.service';
import { AuthGuard } from '@nestjs/passport'; // 예시로 AuthGuard 사용
import { User } from '../user/entities/user.entity';
import { Channel } from './entities/channel.entity';
import { InvalidPasswordException, NotAuthorizedException, NotFoundException }
  from 'src/common/exceptions/chat.exception';
import { ChannelPasswordDto } from './dto/channel-password.dto';


@Controller('channels')
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  @UseGuards(AuthGuard('jwt')) // 예시로 JWT 인증 사용
  @Patch('/enter')
  async enterChannel(
    @Query('channelId') channelId: number,
    @Query('uid') uid: number,
    @Res() response: Response,
  ): Promise<void> {
    console.log('enterChannel');//
    try {
      const user: User = await this.channelService.getAuthenticatedUser(uid);
      const channel: Channel = await this.channelService.enterChannel(user, channelId);
      // 여기서 조건에 따라 적절한 응답을 보내줍니다.
      response.status(200).json({ channel });
    } catch (error) {
      if (error instanceof NotFoundException) {
        response.status(404).json({ error: 'Channel not found' });
      } else if (error instanceof NotAuthorizedException) {
        response.status(401).json({ error: error.message });
      } else if (error instanceof InvalidPasswordException) {
        response.status(400).json({ error: error.message });
      } 
      else {
        response.status(500).json({ error: 'Failed to enter channel' });
      }
    }
  }

  @Post('pwd')
  async verifyPassword(@Body() body: ChannelPasswordDto) {
    const ret = await this.channelService.verifyPassword(body);
    if (ret === false) {
      throw new InvalidPasswordException();
    }
    return ret;
  }

  @UseGuards(AuthGuard('jwt')) // 예시로 JWT 인증 사용
  @Get('/:channelId')
  async getChannelById(@Body() payload: any) {
	const { channelId } = payload;
	const channel = await this.channelService.getChannelById(channelId);
	return { channel };
  }
}
