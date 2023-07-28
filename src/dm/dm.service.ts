import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { DM } from './entities/dm.entity';

@Injectable()
export class DmService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(DM)
    private dmRepository: Repository<DM>,
  ) {}

}
