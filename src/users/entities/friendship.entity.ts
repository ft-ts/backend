import { PrimaryGeneratedColumn, Column, Entity } from 'typeorm';

@Entity()
export class Friendship {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  send_user_id: number;

  @Column({ nullable: false })
  receive_user_id: number;
}
