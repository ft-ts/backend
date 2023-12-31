import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserStatus } from '../enums/userStatus.enum';
import { Friendship } from './friendship.entity';
import { DM } from 'src/dm/entities/dm.entity';
import { ChannelUser } from 'src/channel/entities/channelUser.entity';
import { Block } from './block.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  // uid로 수정?
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

  @OneToMany(() => Block, blocked => blocked.user)
  blocked: Block[];

  @Column({ name: 'status', default: UserStatus.OFFLINE })
  status: UserStatus;

  @Column({ name: 'qr_secret', nullable: false })
  qrSecret: string;

  @Column({ name: 'rating', default: 1000 })
  rating: number;

  @OneToMany(() => DM, (dm) => dm.sender)
  sentDms: DM[];

  @OneToMany(() => DM, (dm) => dm.receiver)
  receiveDms: DM[];

  @Column({ default: 0, nullable: false })
  custom_wins: number;

  @Column({ default: 0, nullable: false })
  custom_losses: number;

  @Column({ default: 0, nullable: false })
  ladder_wins: number;

  @Column({ default: 0, nullable: false })
  ladder_losses: number;

  @Column({ name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @OneToMany(() => ChannelUser, (channelUser) => channelUser.user)
  myChannels: ChannelUser[];
}
