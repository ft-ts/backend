import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany, IntegerType } from 'typeorm';
import { ChannelMode } from '../enum/channelMode.enum';
import { ChannelUser } from './channelUser.entity';
import { Cm } from './cm.entity';

@Entity()
export class Channel {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => ChannelUser, (channelUser) => channelUser.channel)
  channelUser: ChannelUser[];

  @OneToMany(() => Cm, (cm) => cm.channel)
  message: Cm[];

  @Column({ nullable: false })
  title: string;

  @Column({ default: ChannelMode.PUBLIC, nullable: false })
  mode: ChannelMode;

  @Column({ nullable: true })
  password: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column("int", { array: true, nullable: true })
  banned_uid: number[];

  @Column("int", { array: true, nullable: true })
  muted_uid: number[];
}
