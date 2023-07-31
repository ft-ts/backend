import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserStatus } from '../enums/userStatus.enum';
import { Friendship } from './friendship.entity';
import { DM } from 'src/dm/entities/dm.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'intra_id', nullable: false, unique: true })
  uid: number;

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

  @Column({ name: 'qr_secret', nullable: false })
  qrSecret: string;

  @Column({ name: 'rating', default: 1000 })
  rating: number;

  @OneToMany(() => DM, (dm) => dm.sender)
  sentDms: DM[];

  @OneToMany(() => DM, (dm) => dm.receiver)
  receiveDms: DM[];

  @Column({ name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
