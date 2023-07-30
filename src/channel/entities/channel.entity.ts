import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { ChannelMode } from '../enum/channelMode.enum';
import { ChannelUser } from './channelUser.entity';

@Entity()
export class Channel {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => ChannelUser, (channelUser) => channelUser.channel)
  channelUser: ChannelUser[];

  @Column({ nullable: false })
  title: string;

  @Column({ default: ChannelMode.PUBLIC, nullable: false })
  mode: ChannelMode;

  @Column({ nullable: true })
  password: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
