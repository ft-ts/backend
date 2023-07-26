import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Friendship } from '../entities/friendship.entity';

export class FriendshipRepository extends Repository<Friendship> {
  constructor(@InjectRepository(Friendship) private dataSource: DataSource) {
    super(Friendship, dataSource.manager);
  }
}
