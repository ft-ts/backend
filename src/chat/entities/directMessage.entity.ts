import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class DirectMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  user1_id: number;

  @Column({ nullable: false })
  user2_id: number;

  @Column({ nullable: false })
  message: string;

  @Column({ default: new Date() })
  timestamp: Date;

  @Column({ default: false })
  read: boolean;
}
