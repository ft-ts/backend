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
import { DmChannelUser } from '../../chat/entities/dmChannelUser.entity';
import { GroupChannelUser } from '../../chat/entities/groupChannelUser.entity';

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

  @OneToMany(() => Friendship, (friendship) => friendship.user)
  friendships: Friendship[];

  @Column({ name: 'status', default: UserStatus.OFFLINE })
  status: UserStatus;

  @Column({ name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @OneToMany(() => DmChannelUser, (channel) => channel.user)
  myDmChannels: DmChannelUser[];

  @OneToMany(() => GroupChannelUser, (channel) => channel.user)
  myGroupChannels: GroupChannelUser[];
}
