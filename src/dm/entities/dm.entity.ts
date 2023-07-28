import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  BaseEntity,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

enum DmType {
  DM,
  NOTIFICATION,
}

@Entity({ name: 'DM' })
export class DM extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.sentDms)
  sender: User;

  @ManyToOne(() => User, (user) => user.receiveDms)
  receiver: User;

  @Column({ nullable: false })
  message: string;

  @Column({ nullable: false })
  type: DmType;

  @Column()
  data: string;

  @Column({ name: 'read_at' })
  readAt: Date;

  @Column({ name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
