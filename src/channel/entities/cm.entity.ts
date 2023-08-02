import { Entity, Column, ManyToOne, PrimaryGeneratedColumn, BaseEntity, CreateDateColumn } from 'typeorm';
import { ChannelUser } from './channelUser.entity';

@Entity({ name: 'cm' })
export class Cm extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ChannelUser, (channelUser) => channelUser.message)
  sender: ChannelUser;

  @Column('text', { nullable: false })
  content: string;

  @CreateDateColumn()
  timeStamp: Date;
}
