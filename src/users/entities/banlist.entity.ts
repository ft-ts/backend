import { PrimaryGeneratedColumn, Column, Entity } from 'typeorm';

@Entity({ name: 'banlist' })
export class BanList {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  target_user_id: number;
}
