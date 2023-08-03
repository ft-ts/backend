import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ChannelRole } from '../enum/channelRole.enum';
import { User } from '../../user/entities/user.entity';
import { Channel } from '.';
import { Cm } from './cm.entity';

@Entity()
@Index(['user', 'channel'], { unique: true })
export class ChannelUser {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.myChannels)
  @JoinColumn()
  user: User;

  @OneToMany(() => Cm, (cm) => cm.sender)
  message: Cm[]; 

  @ManyToOne(() => Channel, (channel) => channel.channelUser)
  @JoinColumn()
  channel: Channel;

  @Column({ nullable: false, default: new Date() })
  joined_at: Date;

  @Column({ nullable: false, default: ChannelRole.NORMAL })
  role: ChannelRole;
}
