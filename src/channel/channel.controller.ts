import { Controller,Post, Patch, Body, UseGuards, Get, Query, Res, Param } from '@nestjs/common';
import { GetUser } from 'src/common/decorators';
import { Response } from 'express';
import { ChannelService } from './channel.service';
import { AuthGuard } from '@nestjs/passport'; // 예시로 AuthGuard 사용
import { User } from '../user/entities/user.entity';
import { Channel } from './entities/channel.entity';
import { InvalidPasswordException, NotAuthorizedException, NotFoundException }
  from 'src/common/exceptions/chat.exception';
import { ChannelPasswordDto } from './dto/channel-password.dto';
import { AtGuard } from 'src/auth/auth.guard';
import { CreateChannelDto } from './dto/create-channel.dto';


@Controller('channels')
@UseGuards(AtGuard)
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  @Post('create')
  async createChannel(
    @GetUser() user: User,
    @Body() payload: CreateChannelDto,
  ) {
      const channel = await this.channelService.createChannel(user.uid, payload);
      return channel;
  }

  @Post('pwd')
  async verifyPassword(@Body() body: ChannelPasswordDto) {
    const ret = await this.channelService.verifyPassword(body);
    if (ret === false) {
      throw new InvalidPasswordException();
    }
    return ret;
  }

  @Get('/log/:channelId')
  async getChannelLog(
    @GetUser() user : User,
    @Param('channelId') channelId: number
  ) {
    const res = await this.channelService.getChannelMessages(user, channelId)
    return res;
  }

  @Get('/list/my')
  async getMyChannelList(
    @GetUser() user : User,
  ) {
    const res = await this.channelService.getMyChannels(user);
    return res;
  } 

  @Get('/list/all')
  async getAllChannelList(){
    const res = await this.channelService.getAllChannels();
    return res;
  }

  @Get('/props/:channelId')
  async getChannelProps(
    @GetUser() user : User,
    @Param('channelId') channelId: number
  ) {
    const res = await this.channelService.validateChannelAndMember(user, channelId)
    return res;
  }

  @Get('/role/:channelId')
  async getChannelRoles(
    @GetUser() user : User,
    @Param('channelId') channelId: number
  ) {
    const res = await this.channelService.getUserRole(user, channelId);
    return res;
  }

  @Get('/members/:channelId')
  async getChannelMembers(
    @Param('channelId') channelId: number
  ) {
    const res = await this.channelService.getChannelMembers(channelId)
    return res;
  }
  
  @Post('/ban')
  async banMember(
    @GetUser() user : User,
    @Body() payload: {channelId: number, targetUid: number}
  ) {
    const res = await this.channelService.banMember(user, payload)
    return res;
  }

  @Post('/unban')
  async unbanMember(
    @GetUser() user : User,
    @Body() payload: {channelId: number, targetUid: number}
  ){
    const res = await this.channelService.unbanMember(user, payload)
    return res;
  }

  @Post('/kick')
  async kickMember(
    @GetUser() user : User,
    @Body() payload: {channelId: number, targetUid: number}
  ){
    const res = await this.channelService.kickMember(user, payload)
    return res;
  }

  @Post('/invite')
  async inviteMember(
    @GetUser() user : User,
    @Body() payload: {channelId: number, targetUid: number}
  ){
    const res = await this.channelService.inviteMember(user, payload)
    return res;
  }

  @Post('/mute')
  async muteMember(
    @GetUser() user : User,
    @Body() payload: {channelId: number, targetUid: number}
  ){
    const res = await this.channelService.muteMember(user, payload)
    return res;
  }

  @Post('/grant/admin')
  async grantAdmin(
    @GetUser() user : User,
    @Body() payload: {channelId: number, targetUid: number}
  ){
    const res = await this.channelService.grantAdmin(user, payload)
    return res;
  }

  // @Post('/revoke/admin')
  // async revokeAdmin(
  //   @GetUser() user : User,
  //   @Body() payload: {channelId: number, targetUid: number}
  // }{
  //   const res = await this.channelService.revokeAdmin(user, payload);
  // }
}
