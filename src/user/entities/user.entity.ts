import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserStatus } from '../enums/userStatus.enum';
import { Friendship } from './friendship.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'intra_id', nullable: false, unique: true })
  intraId: number;

  @Column({ nullable: false, unique: true })
  name: string;

  @Column({ nullable: false })
  avatar: string;

  @Column({ nullable: false, unique: true })
  email: string;

  @Column({ name: 'two_factor_auth', default: false })
  twoFactorAuth: boolean;

  @OneToMany(() => Friendship, friendship => friendship.user)
  friendships: Friendship[];

  @Column({ name: 'status', default: UserStatus.OFFLINE })
  status: UserStatus;

  @Column({ name: 'hashed_rt', nullable: true })
  hashedRt: string;

  @Column({ name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
