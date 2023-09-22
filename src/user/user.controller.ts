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
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { GetUser } from '../common/decorators';
import { AtGuard } from 'src/auth/auth.guard';

@UseGuards(AtGuard)
@Controller('users')
export class UserController {
  constructor(private readonly usersService: UserService) {}

  @Get()
  findMe(@GetUser() user: User) {
    return this.usersService.findOne(user.uid);
  }

  @Patch()
  async updateUser(@GetUser() user: User, @Body() body) {
    const result = await this.usersService.updateUser(user, body);
    return result;
  }

  @Get('all')
  findAll(@GetUser() user: User) {
    return this.usersService.findAll();
  }

  @Get('all/except/me')
  findAllExcept(@GetUser() user: User) {
    return this.usersService.findAllExceptMe(user);
  }

  @Get('channels/:id')
  findChannelUsers() {
    return this.usersService.findChannelUsers();
  }

  @Get('friends')
  async findFriends(@GetUser() user: User) {
    const result = await this.usersService.findFriends(user);
    return result;
  }

  @Post('friends')
  async createFriendship(@GetUser() user: User, @Body() body) {
    const { targetUid } = body.data;
    const res = await this.usersService.createFriendship(user, targetUid).catch((err) => {
      return err;
    });
    return res;
  }

  @Delete('friends')
  deleteFriendship(@GetUser() user: User, @Body() body) {
    const { targetUid } = body;
    return this.usersService.deleteFriendship(user, targetUid);
  }

  @Get('block')
  async findBlocked(@GetUser() user: User) {
    const result = await this.usersService.findBlocked(user);
    return result;
  }

  @Get('block/all')
  findAllBlocked() {
    return this.usersService.findAllBlocked();
  }

  @Post('block')
  async createBlocked(@GetUser() user: User, @Body() body) {
    const { targetUid } = body.data;
    const res = await this.usersService.createBlocked(user, targetUid);
    return res;
  }

  @Delete('block')
  async deleteBlocked(@GetUser() user: User, @Body() body) {
    const { targetUid } = body;
    const res = await this.usersService.deleteBlocked(user, targetUid);
    return res;
  }

  @Get(':id') // 맨 아래 있어야 함
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }
}
