import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  BaseEntity,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { DmType } from '../enum/DM.enum';
import { DmStatus } from '../enum/dm-status.enum';


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

  @Column({ nullable: false, default: DmType.DM })
  type: DmType;

  @Column({ nullable: false, default: DmStatus.SENT })
  status: DmStatus;

  @Column({ nullable: true, default: "" })
  data: string;

  @Column({ name: 'viewed', default: false })
  viewed: boolean;

  @Column({ name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
