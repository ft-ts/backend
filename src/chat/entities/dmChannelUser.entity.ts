import { Column, PrimaryGeneratedColumn, Entity, Index, ManyToMany, ManyToOne, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { DmChannels } from './dmChannels.entity';
import { Users } from '../../users/entities/user.entity';
import { ChatMessage } from './chatMessage.entity';

@Entity()
export class DmChannelUser {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Users, (user) => user.myDmChannels)
  @JoinColumn()
  user: Users;

  @ManyToOne(() => DmChannels, (channel) => channel.dmChannelUser)
  @JoinColumn()
  channel: DmChannels;

  @OneToMany(() => ChatMessage, (chatMessage) => chatMessage.user)
  @JoinColumn()
  message: ChatMessage[];

  @Column({ nullable: false, default: false })
  is_blocked: boolean;
}
