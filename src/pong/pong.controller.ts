import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PongService } from './pong.service';
import { CreatePongDto } from './dto/create-pong.dto';
import { UpdatePongDto } from './dto/update-pong.dto';

@Controller('pong')
export class PongController {
  constructor(private readonly pongService: PongService) {} 
}
