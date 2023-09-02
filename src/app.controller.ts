import { Controller, Get, UseGuards } from '@nestjs/common';
import { GetUser } from './common/decorators';
import { AtGuard } from 'src/auth/auth.guard';
import { User } from './user/entities/user.entity';

@UseGuards(AtGuard)
@Controller('/')
export class AppController {

  @Get('/check')
  validateUser(@GetUser() user: User) {
    return { message : 'ok', uid: user.uid};
  }
}
