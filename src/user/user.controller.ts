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

  @Get('channels/:id')
  findChannelUsers() {
    return this.usersService.findChannelUsers();
  }

  @Get('friends')
  async findFriends(@GetUser() user: User) {
    const result = await this.usersService.findFriends(user);
    console.log(result);
    return result;
  }

  @Get('friends/all')
  findAllFriendships() {
    return this.usersService.findAllFriendships();
  }

  @Post('friends')
  createFriendship(@GetUser() user: User, @Body() body) {
    const { targetUid } = body;
    return this.usersService.createFriendship(user, targetUid);
  }

  @Delete('friends')
  deleteFriendship(@GetUser() user: User, @Body() body) {
    const { targetUid } = body;
    return this.usersService.deleteFriendship(user, targetUid);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }
}
