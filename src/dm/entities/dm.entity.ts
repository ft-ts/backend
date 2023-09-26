import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  BaseEntity,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity({ name: 'dm' })
export class DM extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.sentDms)
  sender: User;

  @ManyToOne(() => User, (user) => user.receiveDms)
  receiver: User;

  @Column({ nullable: false })
  message: string;

  @Column({ name: 'viewed', default: false })
  viewed: boolean;

  @Column({ name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
