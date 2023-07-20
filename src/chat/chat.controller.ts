import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { GroupChannelService, DmChannelService } from './channel.service';
import { CreateGroupChannelDto } from './dto/channel.dto';
import { User } from '../users/entities/user.entity';

@Controller('group-channels')
export class  GroupChannelController {
  constructor(private readonly channelService: GroupChannelService) {}

  @Post()
  async createGroupChannel(
    @Body() createGroupChannelDto: CreateGroupChannelDto,
    @Query('user') user: User,
  ) {
    return this.channelService.createGroupChannel(createGroupChannelDto, user);
  }

  @Get()
  async getAllGroupChannels() {
    return this.channelService.getAllGroupChannels();
  }

  @Get('my-channels')
  async getMyGroupChannels(@Query('user') user: User) {
    return this.channelService.getMyGroupChannels(user);
  }

  @Get(':id')
  async getGroupChannelById(@Param('id') id: number) {
    return this.channelService.getGroupChannelById(id);
  }

  @Post('enter')
  async enterGroupChannel(
    @Query('userId') userId: number,
    @Query('channelId') channelId: number,
    @Query('password') password: string,
  ) {
    const user = new User();
    user.id = userId;
    return this.channelService.enterGroupChannel(user, channelId, password);
  }

  @Get(':channelId/members')
  async getChannelMembers(@Param('channelId') channelId: number) {
    return this.channelService.getChannelMembers(channelId);
  }
}

@Controller('dm-channels')
export class DmChannelController {
  constructor(private readonly channelService: DmChannelService) {}

  @Post()
  async createDmChannel(
    @Query('userA') userA: User,
    @Query('userB') userB: User,
  ) {
    return this.channelService.createDmChannel(userA, userB);
  }
}
