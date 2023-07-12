import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { ChannelMode } from '../enum/channelMode.enum';

@Entity()
export class Channel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  title: string;

  @Column({ default: 'public', nullable: false })
  mode: ChannelMode;

  @Column({ nullable: true })
  password: string;
}
