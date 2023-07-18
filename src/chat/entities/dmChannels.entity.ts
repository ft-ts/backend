import { Entity, OneToMany, JoinColumn, Index, ManyToOne } from 'typeorm';
import { Channels } from './channels.entity';
import { DmChannelUser } from './dmChannelUser.entity';
import { User } from '../../users/entities/user.entity';

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
