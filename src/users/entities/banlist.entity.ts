import { PrimaryGeneratedColumn, Column, Entity } from 'typeorm';

@Entity()
export class BanList {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  target_user_id: number;
}
