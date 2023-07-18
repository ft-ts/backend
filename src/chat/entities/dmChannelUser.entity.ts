import {
  Column,
  PrimaryGeneratedColumn,
  Entity,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { DmChannels } from './dmChannels.entity';
import { User } from '../../users/entities/user.entity';
import { ChatMessage } from './chatMessage.entity';

@Entity()
export class DmChannelUser {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.myDmChannels)
  @JoinColumn()
  user: User;

  @ManyToOne(() => DmChannels, (channel) => channel.dmChannelUser)
  @JoinColumn()
  channel: DmChannels;

  @OneToMany(() => ChatMessage, (chatMessage) => chatMessage.user)
  @JoinColumn()
  message: ChatMessage[];

  @Column({ nullable: false, default: false })
  is_blocked: boolean;
}
