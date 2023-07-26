import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ChannelMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  user_id: number;

  @Column({ nullable: false })
  channel_id: number;

  @Column({ default: new Date() })
  timestamp: Date;

  @Column({ nullable: false })
  message: string;
}
