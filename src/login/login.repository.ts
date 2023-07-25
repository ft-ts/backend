import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';

export class LoginRepository extends Repository<User> {
  constructor(@InjectRepository(User) private dataSource: DataSource) {
    super(User, dataSource.manager);
  }
}
