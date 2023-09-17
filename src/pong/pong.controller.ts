import { Controller, Get, Param, UseGuards, Res } from '@nestjs/common';
import { PongRepository } from './pong.repository';
import { GetUser } from 'src/common/decorators';
import { AtGuard } from 'src/auth/auth.guard';

@Controller('pong')
@UseGuards(AtGuard)
export class PongController {
  constructor(
    private readonly pongRepository: PongRepository,
    ) {} 

    @Get(':id')
    async getUserMatchHistory(
      @Res() res,
      @GetUser() user: any,
      @Param('id') id: string,
    ) {
      const data = {
        history : await this.pongRepository.getUserMatchHistory(id)
      };
      res.status(200).json(data);
    }
}
