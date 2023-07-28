import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'friendships' })
export class Friendship {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.friendships)
  user: User;

  @ManyToOne(() => User, (user) => user.friendships)
  friend: User;
}
