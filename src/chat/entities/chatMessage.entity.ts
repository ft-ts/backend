import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  BaseEntity,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Channels } from './channels.entity';
import { GroupChannelUser } from './groupChannelUser.entity';

@Entity()
export class ChatMessage extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => GroupChannelUser, (groupChatUser) => groupChatUser.message)
  user: User;

  @ManyToOne(() => Channels, (channel) => channel.chatMessage)
  channel: Channels;

  @Column('text', { nullable: false })
  content: string;

  @CreateDateColumn()
  timeStamp: number;
}
