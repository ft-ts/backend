import { Entity, Column, ManyToMany, JoinTable, OneToMany, ChildEntity } from 'typeorm';
import { ChannelMode } from '../enum/channelMode.enum';
import { User } from '../../users/entities/user.entity';
import { Channels, GroupChannelUser } from './internal';

@Entity()
export class GroupChannels extends Channels {
  @OneToMany(() => User, (user) => user.myGroupChannels)
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
