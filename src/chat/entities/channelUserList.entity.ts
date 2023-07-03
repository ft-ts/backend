import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ChannelRole } from '../common/enum/channelRole.enum';

@Entity()
export class ChannelUserList {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  channel_id: number;

  @Column({ nullable: false })
  user_id: number;

  @Column({ nullable: false, default: 'role' })
  role: ChannelRole;
}
