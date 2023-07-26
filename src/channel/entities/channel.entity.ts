import { Entity, Column, JoinTable, OneToMany, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { ChannelMode } from '../enum/channelMode.enum';
import { User } from '../../user/entities/user.entity';
import { ChannelUser, Cm } from './internal';

@Entity()
export class Channel {
  
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => Cm, (message) => message.channel, {
    cascade: ['insert', 'remove', 'update'],
  })
  chatMessage: Cm[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: number;

  @OneToMany(() => User, (user) => user.myGroupChannels)
  @JoinTable()
  users: User[];

  @OneToMany(
    () => ChannelUser,
    (groupChannelUser) => groupChannelUser.channel,
  )
  groupChannelUser: ChannelUser[];

  @Column({ nullable: false })
  title: string;

  @Column({ default: ChannelMode.PUBLIC, nullable: false })
  mode: ChannelMode;

  @Column({ nullable: true })
  password: string;
}
