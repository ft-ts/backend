import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PongService } from './pong.service';
import { CreatePongDto } from './dto/create-pong.dto';
import { UpdatePongDto } from './dto/update-pong.dto';
import { PongRepository } from './pong.repository';
import { GetUser } from 'src/common/decorators';
import { AtGuard } from 'src/auth/auth.guard';

@Controller('pong')
@UseGuards(AtGuard)
export class PongController {
  constructor(
    private readonly pongRepository: PongRepository,
    ) {} 

    @Get('all')
    getAllMatchHistory() {
      return this.pongRepository.getAllMatchHistory();
    }

    @Get(':id')
    getUserMatchHistory(@GetUser() user: any) {
      return this.pongRepository.getUserMatchHistory(user.uid);
    }
}
