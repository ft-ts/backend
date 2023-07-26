
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChannelRole } from '../enum/channelRole.enum';
import { User } from '../../user/entities/user.entity';
import { Channel, Cm } from '.';

@Entity()
@Index(['user.id', 'channel.id'], { unique: true })
export class ChannelUser {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.myGroupChannels)
  @JoinColumn()
  user: User;

  @ManyToOne(() => Channel, (channel) => channel.groupChannelUser)
  @JoinColumn()
  channel: Channel;

  @OneToMany(() => Cm, (chatMessage) => chatMessage.user)
  @JoinColumn()
  message: Cm[];

  @Column({ nullable: false, default: new Date() })
  joined_at: Date;

  @Column({ nullable: false, default: 'role' })
  role: ChannelRole;

  @Column({ nullable: false, default: false })
  is_muted: boolean;

  @Column({ nullable: false, default: false })
  is_banned: boolean;
}
