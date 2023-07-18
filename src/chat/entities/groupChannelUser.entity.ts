import { Column, Entity, Index, JoinColumn, OneToOne, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ChannelRole } from '../enum/channelRole.enum';
import { GroupChannels } from './groupChannels.entity';
import { Users } from '../../users/entities/user.entity';
import { ChatMessage } from './chatMessage.entity';

@Entity()
@Index(['user.id', 'channel.id'], { unique: true })
export class GroupChannelUser {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Users, (user) => user.myGroupChannels)
  @JoinColumn()
  user: Users;

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