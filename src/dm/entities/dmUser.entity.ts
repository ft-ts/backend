import {
  Column,
  PrimaryGeneratedColumn,
  Entity,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Dm } from './dm.entity';
import { DmChannel } from './dmChannel.entity';


@Entity({ name: 'dm_users' })
export class DmUser {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.myDmChannels)
  @JoinColumn()
  user: User;

  @ManyToOne(() => DmChannel, (channel) => channel.dmChannelUser)
  @JoinColumn()
  channel: DmChannel;

  @OneToMany(() => Dm, (chatMessage) => chatMessage.user)
  @JoinColumn()
  message: Dm[];

  @Column({ nullable: false, default: false })
  is_blocked: boolean;
}
