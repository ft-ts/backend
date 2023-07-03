import { Test, TestingModule } from '@nestjs/testing';
import { PongController } from './pong.controller';
import { PongService } from './pong.service';

describe('PongController', () => {
  let controller: PongController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PongController],
      providers: [PongService],
    }).compile();

    controller = module.get<PongController>(PongController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
