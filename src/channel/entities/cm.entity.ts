import { Entity, Column, ManyToOne, PrimaryGeneratedColumn, BaseEntity, CreateDateColumn, JoinColumn } from 'typeorm';
import { ChannelUser } from './channelUser.entity';
import { Channel } from './channel.entity';
import { User } from '../../user/entities/user.entity';

@Entity({ name: 'cm' })
export class Cm extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Channel, (channel) => channel.message)
  @JoinColumn({name: 'channel_id'})
  channel: Channel;

  @Column({ nullable: false })
  isNotice: boolean;

  @ManyToOne(() => User, (user) => user.uid)
  @JoinColumn({name: 'user_uid'})
  sender: User;

  @Column('text', { nullable: false })
  content: string;

  @CreateDateColumn({ type: 'timestamp' })
  timeStamp: Date;
}
