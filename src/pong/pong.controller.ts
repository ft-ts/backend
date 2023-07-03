import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PongService } from './pong.service';
import { CreatePongDto } from './dto/create-pong.dto';
import { UpdatePongDto } from './dto/update-pong.dto';

@Controller('pong')
export class PongController {
  constructor(private readonly pongService: PongService) {}

  @Post()
  create(@Body() createPongDto: CreatePongDto) {
    return this.pongService.create(createPongDto);
  }

  @Get()
  findAll() {
    return this.pongService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pongService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePongDto: UpdatePongDto) {
    return this.pongService.update(+id, updatePongDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pongService.remove(+id);
  }
}
