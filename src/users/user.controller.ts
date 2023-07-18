import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Req,
  Res,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from './decorators/getUser.decorator';
import { User } from './entities/user.entity';

@Controller('users')
@UseGuards(AuthGuard())
export class UserController {
  constructor(private readonly usersService: UserService) {}

  @Patch('/')
  async updateUser(@GetUser() user: User, @Body() body) {
    const result = await this.usersService.updateUser(user, body);
    return result;
  }

  @Post('add')
  addUser(@Body() body) {
    return this.usersService.addUser(body);
  }

  @Get('all')
  findAll() {
    return this.usersService.findAll();
  }

  @Get('channels/:id')
  findChannelUsers() {
    return this.usersService.findChannelUsers();
  }

  @Get('friends')
  findFriends(@GetUser() user: User) {
    return this.usersService.findFriends(user);
  }

  @Post('friends')
  createFriendship(@GetUser() user: User, @Body() body) {
    return this.usersService.createFriendship(body);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }
}
