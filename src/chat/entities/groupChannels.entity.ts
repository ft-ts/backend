import { Entity, Column, ManyToMany, JoinTable, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ChannelMode } from '../enum/channelMode.enum';
import { GroupChannelUser } from './groupChannelUser.entity';
import { Channels } from './channels.entity';
import { Users } from '../../users/entities/user.entity';

@Entity()
export class GroupChannels extends Channels{
  @ManyToMany(() => Users, user => user.myGroupChannels)
  @JoinTable()
  users: Users[];

  @OneToMany(() => GroupChannelUser, (groupChannelUser) => groupChannelUser.channel)
  groupChannelUser: GroupChannelUser[];

  @Column({ nullable: false })
  title: string;

  @Column({ default: ChannelMode.PUBLIC , nullable: false })
  mode: ChannelMode;

  @Column({ nullable: true })
  password: string;

}
