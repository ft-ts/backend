import { Entity, OneToMany, JoinColumn, Index, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { DmChannelUser, Channels } from './internal';

@Entity()
@Index(['userA', 'userB'], { unique: true })
export class DmChannels extends Channels {
  @OneToMany(() => DmChannelUser, (dmChannelUser) => dmChannelUser.channel)
  @JoinColumn()
  dmChannelUser: DmChannelUser[];

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userA' })
  userA: User;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userB' })
  userB: User;
}
