import { Entity, Column, ManyToOne, PrimaryGeneratedColumn, BaseEntity, CreateDateColumn } from 'typeorm';
import { ChannelUser } from './channelUser.entity';
import { Channel } from './channel.entity';

@Entity({ name: 'cm' })
export class Cm extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Channel, (channel) => channel.message)
  channel: Channel;
  
  @Column('int', { nullable: false })
  sender_uid: number;

  @Column('text', { nullable: false })
  content: string;

  @CreateDateColumn({ type: 'timestamp' })
  timeStamp: Date;
}
