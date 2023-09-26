import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ParseIntPipe,
  UseGuards,
  Delete,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { GetUser } from '../common/decorators';
import { AtGuard } from 'src/auth/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@UseGuards(AtGuard)
@Controller('users')
export class UserController {
  constructor(private readonly usersService: UserService) {}

  @Get()
  findMe(@GetUser() user: User) {
    const res = this.usersService.findOne(user.uid);
    return res;
  }

  @Patch()
  @UseInterceptors(FileInterceptor('imgData'))
  async updateUser(@GetUser() user: User, @Body() body: any) {
    return await this.usersService.updateUser(user, body);
  }

  @Get('all/except/me')
  findAllExcept(@GetUser() user: User) {
    return this.usersService.findAllExceptMe(user);
  }

  @Get('friends')
  async findFriends(@GetUser() user: User) {
    return await this.usersService.findFriends(user);
  }

  @Post('friends')
  async createFriendship(@GetUser() user: User, @Body() body) {
    const { targetUid } = body.data;
    const res = await this.usersService.createFriendship(user.uid, targetUid);
    return res;
  }

  @Delete('friends')
  async deleteFriendship(@GetUser() user: User, @Body() body) {
    const { targetUid } = body;
    const res =  await this.usersService.deleteFriendship(user, targetUid);
    return res;
  }

  @Post('block')
  async createBlocked(@GetUser() user: User, @Body() body) {
    const { targetUid } = body.data;
    const res = await this.usersService.createBlocked(user.uid, targetUid);
    return res;
  }

  @Delete('block')
  async deleteBlocked(@GetUser() user: User, @Body() body) {
    const { targetUid } = body;
    const res = await this.usersService.deleteBlocked(user.uid, targetUid);
    return res;
  }

  @Get(':id') // 맨 아래 있어야 함
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }
}
