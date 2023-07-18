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
import { User } from '../../users/entities/user.entity';
import { ChatMessage, GroupChannels } from './internal';

@Entity()
@Index(['user.id', 'channel.id'], { unique: true })
export class GroupChannelUser {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.myGroupChannels)
  @JoinColumn()
  user: User;

  @ManyToOne(() => GroupChannels, (channel) => channel.groupChannelUser)
  @JoinColumn()
  channel: GroupChannels;

  @OneToMany(() => ChatMessage, (chatMessage) => chatMessage.user)
  @JoinColumn()
  message: ChatMessage[];

  @Column({ nullable: false, default: new Date() })
  joined_at: Date;

  @Column({ nullable: false, default: 'role' })
  role: ChannelRole;

  @Column({ nullable: false, default: false })
  is_muted: boolean;

  @Column({ nullable: false, default: false })
  is_banned: boolean;
}
