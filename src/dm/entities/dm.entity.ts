import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  BaseEntity,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { DmUser } from './dmUser.entity';
import { DmChannel } from './dmChannel.entity';

@Entity({ name: 'dm' })
export class Dm extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => DmUser, (groupChannelUser) => groupChannelUser.user)
  user: User;

  @ManyToOne(() => DmChannel, (channel) => channel.chatMessage)
  channel: DmChannel;

  @Column('text', { nullable: false })
  content: string;

  @CreateDateColumn()
  timeStamp: number;
}
