import { Controller,Post, Patch, Body, UseGuards, Get, Query, Res, Param } from '@nestjs/common';
import { GetUser } from 'src/common/decorators';
import { Response } from 'express';
import { ChannelService } from './channel.service';
import { User } from '../user/entities/user.entity';
import { Channel } from './entities/channel.entity';
import { InvalidPasswordException, NotAuthorizedException, NotFoundException }
  from 'src/common/exceptions/chat.exception';
import { ChannelPasswordDto } from './dto/channel-password.dto';
import { AtGuard } from 'src/auth/auth.guard';
import { CreateChannelDto } from './dto/create-channel.dto';
import { ChannelMode } from './enum/channelMode.enum';
import { SocketService } from 'src/common/service/socket.service';
import { ChannelRole } from './enum/channelRole.enum';

@Controller('channels')
@UseGuards(AtGuard)
export class ChannelController {
  constructor(private readonly channelService: ChannelService,
    private readonly socketService: SocketService) {}

  @Post('create')
  async createChannel(
    @GetUser() user: User,
    @Body() payload: CreateChannelDto,
  ) {
      const channel = await this.channelService.createChannel(user.uid, payload);
      const socket = await this.socketService.getSocket(user.uid);
      await socket.join(`channel/channel-${channel.id}`);
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
    const res = await this.channelService.banMember(user, payload);
    const targetUserSocket = await this.socketService.getSocket(payload.targetUid);
    targetUserSocket.emit('channel/out', { channelId: payload.channelId, reason: 'ban' })
    await targetUserSocket.leave(`channel/channel-${payload.channelId}`);
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
    const res = await this.channelService.kickMember(user, payload);
    const targetUserSocket = await this.socketService.getSocket(payload.targetUid);
    targetUserSocket.emit('channel/out', { channelId: payload.channelId, reason: 'kick' })
    await targetUserSocket.leave(`channel/channel-${payload.channelId}`);
    return res;
  }

  @Post('/mute')
  async muteMember(
    @GetUser() user : User,
    @Body() payload: {channelId: number, targetUid: number}
  ){
    const res = await this.channelService.muteMember(user, payload);
    return res; 
  }

  @Post('/grant/admin')
  async grantAdmin(
    @GetUser() user : User,
    @Body() payload: {channelId: number, targetUid: number}
  ){
    const res = await this.channelService.grantAdmin(user, payload);
    return res;
  }

  @Post('/revoke/admin')
  async revokeAdmin(
    @GetUser() user : User,
    @Body() payload: {channelId: number, targetUid: number}
  ){
    const res = await this.channelService.revokeAdmin(user, payload);
    return res;
  }

  @Post('/update')
  async postChannelUpdate(
    @GetUser() user : User,
    @Body() payload: {channelId: number, title: string, password: string, mode: ChannelMode}
  ) {
    const res = await this.channelService.updateChannel(user, payload);
    return res;
  }

  @Post('/invite')
  async postChannelInvite(
    @GetUser() user : User,
    @Body() payload: {channelId: number, targetUid: number}
  ){
    const res = await this.channelService.inviteMember(payload);
    const targetUserSocket = await this.socketService.getSocket(payload.targetUid);
    targetUserSocket.emit('channel/invite', { channelId: payload.channelId });
    return res;
  }

  @Post('/join')
  async postChannelJoin(
    @GetUser() user : User,
    @Body() payload: {channelId: number, password: string}
  ){
    const res = await this.channelService.joinChannel(user.uid, payload);
    const socket = await this.socketService.getSocket(user.uid);
    await socket.join(`channel/channel-${payload.channelId}`);
    return res;
  }

  @Post('/leave')
  async postChannelLeave(
    @GetUser() user : User,
    @Body() payload: {channelId: number}
  ){
    const res = await this.channelService.leave(user.uid, payload.channelId);
    return res;
  }

}
