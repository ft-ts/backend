import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  BaseEntity,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Channel, ChannelUser } from './internal';

@Entity({ name: 'cm'})
export class Cm extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ChannelUser, (groupChannelUser) => groupChannelUser.user)
  user: User;

  @ManyToOne(() => Channel, (channel) => channel.chatMessage)
  channel: Channel;

  @Column('text', { nullable: false })
  content: string;

  @CreateDateColumn()
  timeStamp: number;
}
