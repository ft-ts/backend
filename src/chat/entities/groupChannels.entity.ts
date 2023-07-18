import { Entity, Column, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { ChannelMode } from '../enum/channelMode.enum';
import { GroupChannelUser } from './groupChannelUser.entity';
import { Channels } from './channels.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class GroupChannels extends Channels {
  @ManyToMany(() => User, (user) => user.myGroupChannels)
  @JoinTable()
  users: User[];

  @OneToMany(
    () => GroupChannelUser,
    (groupChannelUser) => groupChannelUser.channel,
  )
  groupChannelUser: GroupChannelUser[];

  @Column({ nullable: false })
  title: string;

  @Column({ default: ChannelMode.PUBLIC, nullable: false })
  mode: ChannelMode;

  @Column({ nullable: true })
  password: string;
}
